// Función de Vercel: sincroniza la MySQL de la plataforma con Supabase.
// La llama el cron de Vercel una vez por día (vercel.json) o un admin desde el panel ("Sincronizar ahora").
// Variables de entorno (SOLO servidor, nunca con prefijo VITE_):
//   MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, MYSQL_SSL
//   SUPABASE_URL, SUPABASE_SECRET_KEY, CRON_SECRET, SYNC_DRY_RUN
import mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";
import { computeCompany, diffMonths, writeCompany, MONTHS } from "./_lib/sync-core.js";

export default async function handler(req, res) {
  const env = process.env;
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

    // ── 2. Empresas y sus cupones (cargados en el admin) ──
    const { data: links, error: lErr } = await sb.from("company_coupons").select("company_id, coupon_code");
    if (lErr) throw new Error(`company_coupons: ${lErr.message}`);
    const { data: companies } = await sb.from("companies").select("id, name");
    const byCompany = {};
    for (const l of links || []) (byCompany[l.company_id] = byCompany[l.company_id] || []).push(l.coupon_code);

    // ── 3. Calcular, comparar y (si no es prueba) escribir ──
    const report = [];
    for (const co of companies || []) {
      const codes = byCompany[co.id] || [];
      if (!codes.length) { report.push({ company: co.name, skipped: "Sin cupones asignados" }); continue; }
      const data = await computeCompany(conn, codes, today);
      const { data: loaded } = await sb.from("sessions_data").select("month, year, canjeadas, realizadas, activos, nuevos, total_historico, primera_vez").eq("company_id", co.id);
      const diffs = diffMonths(data.months, loaded || []);
      if (!dryRun) await writeCompany(sb, co.id, data, periodLabel);
      report.push({ company: co.name, codes, unknownCodes: data.unknownCodes, months: data.months.length,
        last: data.months.at(-1) || null, reasons: data.reasons.length, diffs: diffs.slice(0, 200), diffCount: diffs.length });
    }

    const summary = { dryRun, periodLabel, companies: report };
    if (runId) await sb.from("sync_runs").update({ status: "ok", finished_at: new Date().toISOString(), summary }).eq("id", runId);
    return res.status(200).json({ ok: true, ...summary });
  } catch (e) {
    const msg = String(e?.message || e).replace(/password=\S+/gi, "password=***");
    if (runId) await sb.from("sync_runs").update({ status: "error", finished_at: new Date().toISOString(), error: msg }).eq("id", runId);
    return res.status(500).json({ ok: false, dryRun, error: msg });
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}
