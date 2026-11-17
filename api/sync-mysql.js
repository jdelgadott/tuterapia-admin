// Función de Vercel: sincroniza la MySQL de la plataforma con Supabase.
// La llama el cron de Vercel una vez por día (vercel.json) o un admin desde el panel ("Sincronizar ahora").
// Variables de entorno (SOLO servidor, nunca con prefijo VITE_):
//   MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, MYSQL_SSL
//   SUPABASE_URL, SUPABASE_SECRET_KEY, CRON_SECRET, SYNC_DRY_RUN
//   SYNC_FROM (opcional, "AAAA-MM"): primer mes que se escribe. Si no está, ventana MÓVIL de un año:
//   desde el mismo mes del año anterior al último mes cerrado (hoy nov 2026 → oct 2025 a oct 2026, más nov parcial).
//   Lo cargado antes de ese mes no se toca.
import mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";
import { computeCompany, diffMonths, writeCompany, loadPlatformCodes, resolveCodes, MONTHS } from "./_lib/sync-core.js";

// Vercel corta la función a los 60s (vercel.json). Si se corta sola, el informe se pierde y,
// en modo real, quedan unas empresas escritas y otras no SIN que nadie se entere: la fila de
// sync_runs se queda en "En curso" para siempre. Por eso se frena antes, por las buenas:
// no se arranca una empresa nueva pasado este tiempo y se devuelve el informe de lo que sí se hizo.
const DEADLINE_MS = 48000;

export default async function handler(req, res) {
  const env = process.env;
  const startedAt = Date.now();
  const log = (m) => console.log(`[sync +${((Date.now() - startedAt) / 1000).toFixed(1)}s] ${m}`);
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

  // ── 1. Quién llama: el cron (CRON_SECRET) o alguien del equipo (sesión de admin_users) ──
  const auth = req.headers.authorization || "";
  let trigger = null;
  if (env.CRON_SECRET && auth === `Bearer ${env.CRON_SECRET}`) trigger = "cron";
  else if (auth.startsWith("Bearer ")) {
    const { data: { user } } = await sb.auth.getUser(auth.slice(7));
    const email = (user?.email || "").toLowerCase();
    const { data: isAdmin } = email ? await sb.from("admin_users").select("id").eq("email", email).maybeSingle() : { data: null };
    if (isAdmin) trigger = "manual";
  }
  if (!trigger) return res.status(401).json({ error: "No autorizado" });

  // Modo prueba: calcula y compara, sin escribir nada en Supabase
  const dryRun = env.SYNC_DRY_RUN !== "false" || req.query?.dry === "1";
  const today = new Date();
  const lastFull = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const periodLabel = `${MONTHS[lastFull.getMonth()]} ${lastFull.getFullYear()}`; // foto de motivos del último mes cerrado
  const fm = String(env.SYNC_FROM || "").match(/^(\d{4})-(\d{2})$/);
  const rolling = new Date(today.getFullYear(), today.getMonth() - 13, 1); // último mes cerrado − 12 meses
  const fromYM = fm ? { y: Number(fm[1]), m: Number(fm[2]) } : { y: rolling.getFullYear(), m: rolling.getMonth() + 1 };

  let conn, runId = null;
  try {
    if (!dryRun) {
      const { data } = await sb.from("sync_runs").insert({ dry_run: false, trigger }).select("id").single();
      runId = data?.id || null;
    }
    conn = await mysql.createConnection({
      host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT || 3306), database: env.MYSQL_DATABASE,
      user: env.MYSQL_USER, password: env.MYSQL_PASSWORD,
      ssl: env.MYSQL_SSL === "true" ? { rejectUnauthorized: true } : undefined,
      connectTimeout: 10000, dateStrings: false, charset: "utf8mb4",
    });
    await conn.query("SET SESSION TRANSACTION READ ONLY");
    // Las trazas van por consola además de por el informe: si la función igual se corta,
    // el informe se pierde entero pero esto queda en los logs de Vercel y dice hasta dónde llegó.
    log("conectado a la plataforma");
    // Los códigos de la plataforma se leen UNA vez para todas las empresas (ver resolveCodes).
    const platformCodes = await loadPlatformCodes(conn);
    log(`códigos de la plataforma: ${platformCodes.length}`);

    // ── 2. Empresas y sus cupones (cargados en el admin) ──
    const { data: links, error: lErr } = await sb.from("company_coupons").select("company_id, coupon_code, kind");
    if (lErr) throw new Error(`company_coupons: ${lErr.message}`);
    const { data: companies } = await sb.from("companies").select("id, name");
    const byCompany = {};
    for (const l of links || []) (byCompany[l.company_id] = byCompany[l.company_id] || []).push({ coupon_code: l.coupon_code, kind: l.kind || "plan" });

    // ── 3a. Primero lo barato: traducir los cupones de TODAS las empresas ──
    // Es solo comparar textos en memoria, así que entra siempre. Y es lo que contesta las dos
    // preguntas que importan antes de habilitar la escritura: qué cupones cargados no existen
    // en la plataforma y qué se llevó puesto cada comodín. Va antes de los totales a propósito:
    // aunque la función se quede sin tiempo, esta parte del informe siempre llega.
    const tasks = [], report = [];
    for (const co of companies || []) {
      const entries = byCompany[co.id] || [];
      if (!entries.length) { report.push({ company: co.name, skipped: "Sin cupones asignados" }); continue; }
      const resolved = resolveCodes(platformCodes, entries);
      const row = { company: co.name, codes: entries.map((c) => c.coupon_code), unknownCodes: resolved.unknown, matched: resolved.matched, realCodes: resolved.codes.length };
      report.push(row);
      tasks.push({ co, resolved, row });
    }

    // Un código de la plataforma tiene que ser de UNA empresa sola. El unique de company_coupons
    // lo garantiza para los códigos escritos a mano, pero los comodines lo esquivan: dos empresas
    // pueden terminar reclamando el mismo cupón real y nadie se entera. Acá se chequea.
    const owners = {};
    for (const t of tasks) for (const c of t.resolved.codes) (owners[c] = owners[c] || []).push(t.co.name);
    const conflicts = Object.entries(owners).filter(([, list]) => new Set(list).size > 1)
      .map(([code, list]) => ({ code, companies: [...new Set(list)] }));
    if (conflicts.length) log(`cupones reclamados por mas de una empresa: ${conflicts.map((c) => c.code).join(", ")}`);
    log(`cupones traducidos: ${tasks.length} empresas, ${Object.keys(owners).length} codigos reales`);

    // ── 3b. Después lo caro: totales, comparación y (si no es prueba) escritura ──
    // No se arranca una empresa nueva si no entra en lo que queda: se mide cuánto tardó la más
    // lenta hasta ahora y se deja ese margen. Si no, la función muere a los 60s y se pierde todo.
    const pending = [];
    let slowest = 0;
    for (const t of tasks) {
      const left = DEADLINE_MS - (Date.now() - startedAt);
      if (left < slowest + 5000) { pending.push(t.co.name); continue; }
      const t0 = Date.now();
      const data = await computeCompany(conn, t.resolved, today, fromYM);
      const { data: loaded } = await sb.from("sessions_data").select("month, year, canjeadas, realizadas, activos, nuevos, total_historico, primera_vez").eq("company_id", t.co.id);
      const diffs = diffMonths(data.months, loaded || []);
      if (!dryRun) await writeCompany(sb, t.co.id, data, periodLabel);
      const ms = Date.now() - t0;
      slowest = Math.max(slowest, ms);
      Object.assign(t.row, { months: data.months.length, last: data.months.at(-1) || null, reasons: data.reasons.length,
        diffs: diffs.slice(0, 200), diffCount: diffs.length, ms });
      log(`${t.co.name}: ${(ms / 1000).toFixed(1)}s (${data.codes.length} codigos, ${data.months.length} meses)`);
    }
    if (pending.length) log(`sin tiempo para ${pending.length}: ${pending.join(", ")}`);

    const summary = { dryRun, periodLabel, from: `${fromYM.y}-${String(fromYM.m).padStart(2, "0")}`, companies: report,
      ms: Date.now() - startedAt, pending: pending.length ? pending : undefined, conflicts: conflicts.length ? conflicts : undefined };
    if (runId) await sb.from("sync_runs").update({ status: pending.length ? "incompleto" : "ok", finished_at: new Date().toISOString(), summary }).eq("id", runId);
    return res.status(200).json({ ok: true, ...summary });
  } catch (e) {
    const msg = String(e?.message || e).replace(/password=\S+/gi, "password=***");
    if (runId) await sb.from("sync_runs").update({ status: "error", finished_at: new Date().toISOString(), error: msg }).eq("id", runId);
    return res.status(500).json({ ok: false, dryRun, error: msg });
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}
