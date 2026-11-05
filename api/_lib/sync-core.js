// Núcleo de la sincronización MySQL (plataforma) → Supabase (dash).
// Solo lee totales agregados: nunca selecciona nombres, mails, teléfonos ni comentarios.
// Tablas de la plataforma que usa (y nada más): cupones, pacientes_cupones, sesiones,
// pacientes_decisiones (solo primera_vez), paciente_decisiones_etiquetas, etiquetas_decisiones.

export const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const key = (y, m) => `${y}-${m}`;

// Sesiones de la empresa = sesiones pagadas con un pago en el que se usó alguno de sus cupones.
const COMPANY_SESSIONS = `
  SELECT DISTINCT s.id, s.id_paciente, s.fecha, s.realizada, s.tipo_session, c.codigo
  FROM sesiones s
  JOIN pacientes_cupones pc ON pc.id_pago = s.id_pago
  JOIN cupones c ON c.id = pc.id_cupon
  WHERE c.codigo IN (?)`;

/**
 * Calcula los totales de UNA empresa.
 * @param conn    conexión mysql2/promise
 * @param codes   códigos de cupón de la empresa (company_coupons.coupon_code)
 * @param today   fecha de corte (el mes en curso queda marcado como parcial)
 */
export async function computeCompany(conn, codes, today = new Date()) {
  if (!codes.length) return { months: [], coupons: [], reasons: [], unknownCodes: [] };

  const [found] = await conn.query("SELECT codigo FROM cupones WHERE codigo IN (?)", [codes]);
  const unknownCodes = codes.filter((c) => !found.some((f) => f.codigo === c));

  // 1. Sesiones por mes y por cupón (canjeadas = sesiones pagadas con el cupón; realizadas = realizada=1)
  const [byCoupon] = await conn.query(
    `SELECT YEAR(t.fecha) y, MONTH(t.fecha) m, t.codigo,
            COUNT(*) canjeadas, SUM(t.realizada = 1) realizadas, SUM(t.tipo_session = 'presencial') presenciales
     FROM (${COMPANY_SESSIONS}) t GROUP BY y, m, t.codigo ORDER BY y, m`, [codes]);

  // 2. Personas activas por mes (al menos una sesión ese mes)
  const [activos] = await conn.query(
    `SELECT YEAR(t.fecha) y, MONTH(t.fecha) m, COUNT(DISTINCT t.id_paciente) activos
     FROM (${COMPANY_SESSIONS}) t GROUP BY y, m`, [codes]);

  // 3. Personas nuevas por mes = su PRIMERA sesión con un cupón de la empresa (personas únicas, no reingresos)
  //    + cuántas de ellas dijeron que es su primera vez en terapia
  const [nuevos] = await conn.query(
    `SELECT YEAR(f.primera) y, MONTH(f.primera) m, COUNT(*) nuevos, SUM(d.primera_vez = 'si') primera_vez
     FROM (SELECT t.id_paciente, MIN(t.fecha) primera FROM (${COMPANY_SESSIONS}) t GROUP BY t.id_paciente) f
     LEFT JOIN pacientes_decisiones d ON d.id_paciente = f.id_paciente
     GROUP BY y, m`, [codes]);

  // 4. Motivos de consulta (acumulado): personas de la empresa por etiqueta elegida
  const [reasons] = await conn.query(
    `SELECT e.titulo reason, COUNT(DISTINCT p.id_paciente) count
     FROM (SELECT DISTINCT t.id_paciente FROM (${COMPANY_SESSIONS}) t) p
     JOIN paciente_decisiones_etiquetas pde ON pde.idPacienteDecisiones = p.id_paciente
     JOIN etiquetas_decisiones e ON e.id = pde.idEtiqueta
     GROUP BY e.titulo ORDER BY count DESC`, [codes]);

  // Armado por mes, con el total histórico acumulado (nunca baja)
  const all = new Map();
  const row = (y, m) => {
    const k = key(y, m);
    if (!all.has(k)) all.set(k, { year: Number(y), monthNum: Number(m), canjeadas: 0, realizadas: 0, presenciales: 0, activos: 0, nuevos: 0, primera_vez: 0 });
    return all.get(k);
  };
  for (const r of byCoupon) { const x = row(r.y, r.m); x.canjeadas += Number(r.canjeadas); x.realizadas += Number(r.realizadas); x.presenciales += Number(r.presenciales); }
  for (const r of activos) row(r.y, r.m).activos = Number(r.activos);
  for (const r of nuevos) { const x = row(r.y, r.m); x.nuevos = Number(r.nuevos); x.primera_vez = Number(r.primera_vez || 0); }

  const curY = today.getFullYear(), curM = today.getMonth() + 1;
  let hist = 0;
  const months = [...all.values()]
    .sort((a, b) => a.year - b.year || a.monthNum - b.monthNum)
    .filter((x) => x.year < curY || (x.year === curY && x.monthNum <= curM))
    .map((x) => { hist += x.nuevos; return { ...x, month: MONTHS[x.monthNum - 1], total_historico: hist, partial: x.year === curY && x.monthNum === curM }; });

  const coupons = byCoupon
    .filter((r) => Number(r.y) < curY || (Number(r.y) === curY && Number(r.m) <= curM))
    .map((r) => ({ year: Number(r.y), month: MONTHS[Number(r.m) - 1], coupon_code: r.codigo, sessions: Number(r.canjeadas) }));

  return { months, coupons, reasons: reasons.map((r) => ({ reason: r.reason, count: Number(r.count) })), unknownCodes };
}

/** Compara lo que trae la MySQL contra lo que hoy está cargado en sessions_data. */
export function diffMonths(computed, loaded) {
  const fields = ["canjeadas", "realizadas", "activos", "nuevos", "total_historico", "primera_vez"];
  const diffs = [];
  for (const c of computed) {
    const l = loaded.find((x) => x.year === c.year && x.month === c.month);
    if (!l) { diffs.push({ month: `${c.month} ${c.year}`, field: "(mes nuevo)", loaded: null, mysql: c.canjeadas }); continue; }
    for (const f of fields) if (Number(l[f] || 0) !== Number(c[f] || 0)) diffs.push({ month: `${c.month} ${c.year}`, field: f, loaded: Number(l[f] || 0), mysql: Number(c[f] || 0) });
  }
  return diffs;
}

/** Escribe en Supabase los totales de una empresa (solo cuando NO es modo prueba). */
export async function writeCompany(sb, companyId, data, periodLabel) {
  if (data.months.length) {
    const rows = data.months.map((m) => ({ company_id: companyId, month: m.month, year: m.year, canjeadas: m.canjeadas, realizadas: m.realizadas,
      activos: m.activos, nuevos: m.nuevos, total_historico: m.total_historico, primera_vez: m.primera_vez, partial: m.partial }));
    const { error } = await sb.from("sessions_data").upsert(rows, { onConflict: "company_id,month,year" });
    if (error) throw new Error(`sessions_data: ${error.message}`);
  }
  if (data.coupons.length) {
    const rows = data.coupons.map((c) => ({ company_id: companyId, ...c, source: "sync" }));
    const { error } = await sb.from("sessions_by_coupon").upsert(rows, { onConflict: "company_id,month,year,coupon_code" });
    if (error) throw new Error(`sessions_by_coupon: ${error.message}`);
  }
  if (data.reasons.length) {
    // Una foto por período: reemplaza solo el período de esta corrida, el historial queda
    await sb.from("consultation_reasons").delete().eq("company_id", companyId).eq("period", periodLabel);
    const total = data.months.at(-1)?.total_historico || 0;
    const rows = data.reasons.map((r) => ({ company_id: companyId, reason: r.reason, count: r.count, period: periodLabel,
      percentage: total ? Math.round((r.count / total) * 100) : null }));
    const { error } = await sb.from("consultation_reasons").insert(rows);
    if (error) throw new Error(`consultation_reasons: ${error.message}`);
  }
}
