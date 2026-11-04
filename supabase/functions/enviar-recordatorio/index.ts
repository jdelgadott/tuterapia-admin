// Edge Function: manda el recordatorio de pago de una factura.
// Reemplaza el envío que hacía el admin desde el navegador con la clave de Resend escrita en el código.
// Secretos (Supabase → Edge Functions → Secrets): RESEND_API_KEY.
// (La clave vieja que estaba en el código ya no sirve: Resend la rechaza. No hay que revocar nada.)
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los provee Supabase automáticamente.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // 1. Solo el equipo de Tu Terapia (admin_users) puede mandar recordatorios
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    const email = (user?.email || "").toLowerCase();
    const { data: isAdmin } = await admin.from("admin_users").select("id").eq("email", email).maybeSingle();
    if (!user || !isAdmin) return json({ error: "No autorizado" }, 403);

    // 2. Los datos salen de la base, no del navegador (nadie puede cambiar destinatario ni texto)
    const { billing_id } = await req.json();
    const { data: bill } = await admin.from("billing").select("id, period, amount, status, company_id").eq("id", billing_id).maybeSingle();
    if (!bill) return json({ error: "Factura no encontrada" }, 404);
    if (bill.status === "pagado") return json({ error: "La factura ya está paga" }, 400);
    const { data: co } = await admin.from("companies").select("referente_email").eq("id", bill.company_id).maybeSingle();
    if (!co?.referente_email) return json({ error: "La empresa no tiene referente asignado" }, 400);

    // Decirlo claro: sin esto el error seria "Resend rechazo el envio" y mandaria a buscar donde no es.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "Falta configurar RESEND_API_KEY en los secrets de Supabase" }, 500);

    const monto = new Intl.NumberFormat("es-UY").format(bill.amount || 0);
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "noreply@tuterapia-empresas.com",
        to: co.referente_email,
        subject: `Recordatorio de pago — ${bill.period} · Tu Terapia`,
        html: `<p>Te recordamos que la factura del período <b>${bill.period}</b> por <b>UY$ ${monto}</b> está pendiente de pago.</p><p>Podés verla desde <a href="https://tuterapia-empresas.com">tu panel de bienestar</a>.</p><p>El equipo de Tu Terapia</p>`,
      }),
    });
    // El motivo queda en los logs de la función (no se devuelve al navegador, por las dudas).
    if (!r.ok) {
      console.error("resend", r.status, await r.text().catch(() => ""));
      return json({ error: `Resend rechazó el envío (${r.status}). El motivo está en los logs de la función.` }, 502);
    }
    return json({ ok: true });
  } catch (_e) {
    return json({ error: "Error inesperado" }, 500);
  }
});
