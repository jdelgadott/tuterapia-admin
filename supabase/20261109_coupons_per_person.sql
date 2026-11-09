-- ════════════════════════════════════════════════════════════════════════════
-- Empresas con un cupón por persona (nov 2026)
-- APLICADO EN PRODUCCIÓN EL 9 NOV 2026 (migración `companies_coupons_per_person`).
--
-- Por qué: hay dos modelos conviviendo. Algunas empresas tienen UN cupón para
-- todos los colaboradores; otras tienen UNO POR PERSONA.
--
-- El dash del cliente dibuja la barra de "Sesiones por mes" partida en un color
-- por cupón, y el tooltip lista cada cupón con su número de sesiones
-- (tuterapia-dashempresa/src/App.jsx, bloque "individual" → "Sesiones").
-- Con un cupón por empresa eso está bien. Con un cupón por persona, esa barra le
-- muestra a RRHH del cliente CUÁNTAS SESIONES DE TERAPIA HIZO CADA COLABORADOR,
-- mes a mes. No hace falta que el código lleve el nombre adentro: un código
-- estable por persona durante doce meses alcanza para atarlo a alguien en un
-- equipo chico.
--
-- Eso contradice lo que el resto del sistema cuida: la sincronización solo lee
-- totales agregados y nunca nombres; la encuesta no publica resultados con menos
-- de 3 respuestas por segmento; la empresa nunca ve respuestas individuales.
--
-- Desde ahora:
--   coupons_per_person = false  → el dash abre la barra por cupón (lo de siempre)
--   coupons_per_person = true   → el dash suma todos los cupones en una sola
--                                 serie "Sesiones" y no muestra ni leyenda ni
--                                 desglose en el tooltip
--
-- Se marca a mano desde el admin → Empresas → Configuración → "Cupones de la
-- plataforma". El admin además avisa en rojo si una empresa tiene más de 5
-- cupones y la casilla quedó sin marcar.
--
-- Es un indicador EXPLÍCITO a propósito: no se deduce de la cantidad de cupones.
-- "Si tiene más de N los agrupo" es la clase de regla implícita que un día falla
-- callada y expone datos de alguien.
--
-- Aditiva y con default: ninguna empresa cambia de comportamiento al aplicarla.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.companies
  add column if not exists coupons_per_person boolean not null default false;

comment on column public.companies.coupons_per_person is
  'true = la empresa usa un cupon por persona (no uno general para todos). En ese caso el dash NO abre la barra de sesiones por cupon: hacerlo le mostraria al cliente cuantas sesiones hizo cada colaborador. Arranca en false, que es el comportamiento historico.';

-- Verificación:
--   select name, coupons_per_person,
--          (select count(*) from company_coupons cc where cc.company_id = c.id) as cupones
--   from companies c order by name;
