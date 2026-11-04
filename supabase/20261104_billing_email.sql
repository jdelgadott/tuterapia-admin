-- ════════════════════════════════════════════════════════════════════════════
-- Contacto de facturación del cliente (nov 2026)
-- APLICADO EN PRODUCCIÓN EL 4 NOV 2026 (migración `companies_billing_email`).
--
-- Por qué: el botón "✉ Recordatorio" de Facturación mandaba el mail a
-- `companies.referente_email`, que es el referente de Tu Terapia asignado a la
-- empresa — o sea, gente del equipo. El texto del mail, en cambio, está escrito
-- para el cliente ("te recordamos que tu factura está pendiente de pago").
-- No existía ninguna columna con el contacto de cobranza de la empresa:
-- `contact_name` guarda un nombre, sin mail.
--
-- Desde ahora:
--   billing_email    → a quién se le reclama el pago (la empresa cliente)
--   referente_email  → el referente de TT; viaja solo como reply-to del mail
--
-- Aditiva: no borra ni pisa nada. Las empresas arrancan con billing_email null y
-- el botón avisa "Falta el mail de facturación del cliente" hasta que se cargue
-- desde Empresas → Configuración. No cae al referente a propósito.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.companies
  add column if not exists billing_email text;

-- Validación de formato: un typo en un mail ya hizo antes que una empresa
-- mostrara a la persona equivocada durante semanas (ver referente_email).
alter table public.companies
  drop constraint if exists companies_billing_email_chk;
alter table public.companies
  add constraint companies_billing_email_chk
  check (billing_email is null or billing_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

comment on column public.companies.billing_email is
  'Mail de la persona de la empresa que procesa el pago. Destinatario del recordatorio de factura. No confundir con referente_email (equipo TT).';

-- Verificación:
--   select name, billing_email from companies order by name;
