-- ════════════════════════════════════════════════════════════════════════════
-- Rediseño del dash de empresas (nov 2026)
-- TODO ES ADITIVO: no se borra ni se renombra nada que use producción hoy.
-- Aplicar ANTES de publicar el admin y el dash nuevos. Revisado por: ______
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Sesiones por cupón (barras de colores en Colaboradores → Sesiones) ──
create table if not exists public.sessions_by_coupon (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  month        text not null,                 -- mismo formato que sessions_data: "Ago"
  year         integer not null,
  coupon_code  text not null,                 -- ej. "#bienestarbc"
  sessions     integer not null default 0 check (sessions >= 0),
  source       text not null default 'manual' check (source in ('manual','csv','sync')),
  created_at   timestamptz not null default now(),
  unique (company_id, month, year, coupon_code)
);
create index if not exists sessions_by_coupon_company_idx on public.sessions_by_coupon(company_id);

-- ── 1b. Qué cupones de la plataforma (MySQL `cupones.codigo`) pertenecen a cada empresa ──
-- La sincronización usa esta tabla para saber qué sesiones son de cada empresa.
create table if not exists public.company_coupons (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  coupon_code  text not null unique,           -- un cupón pertenece a UNA sola empresa
  label        text,                           -- "general", "caso particular"…
  created_at   timestamptz not null default now()
);

-- ── 2. Encuesta emergente por cupón dentro de la plataforma ──
create table if not exists public.encuesta_popup (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  period                text not null,        -- "S2 2026"
  n                     integer not null check (n >= 0),
  mejoro_trabajo        numeric check (mejoro_trabajo between 0 and 100),
  recomendaria          numeric check (recomendaria between 0 and 100),
  no_habria_consultado  numeric check (no_habria_consultado between 0 and 100),
  source                text not null default 'manual' check (source in ('manual','sync')),
  created_at            timestamptz not null default now(),
  unique (company_id, period)
);

-- ── 3. Reunión semestral de resultados + informe descargable (Consultoría) ──
create table if not exists public.reuniones_semestrales (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  period       text not null,                 -- "S1 2026"
  date         date,
  time         text,                          -- "10:00"
  minutes_url  text,                          -- minuta
  report_url   text,                          -- informe PDF (bucket "informes")
  created_at   timestamptz not null default now(),
  unique (company_id, period)
);

-- ── 4. Feedback de RRHH sobre cada contenido ("¿Te sirvió? ★") ──
create table if not exists public.content_feedback (
  id          uuid primary key default gen_random_uuid(),
  content_id  uuid not null references public.content(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_email  text not null default lower(coalesce(auth.jwt()->>'email','')),
  stars       integer not null check (stars between 1 and 5),
  comment     text check (char_length(comment) <= 1000),
  created_at  timestamptz not null default now()
);
create index if not exists content_feedback_content_idx on public.content_feedback(content_id);

-- ── 5. Registro de corridas de la sincronización con la MySQL ──
create table if not exists public.sync_runs (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  dry_run     boolean not null,
  trigger     text not null default 'cron' check (trigger in ('cron','manual')),
  status      text not null default 'running' check (status in ('running','ok','error')),
  summary     jsonb,                          -- totales por empresa, diferencias vs. lo cargado
  error       text
);

-- ── 6. Columnas nuevas en tablas existentes ──
-- Iniciativas (Cultura → Talleres)
alter table public.workshops
  add column if not exists initiative_type text default 'taller'
    check (initiative_type in ('taller','contencion','evento','stand','activacion')),
  add column if not exists participants integer check (participants is null or participants >= 0),
  add column if not exists responses    integer check (responses is null or responses >= 0),
  add column if not exists survey_url   text,     -- Typeform de feedback
  add column if not exists report_url   text,     -- informe de resultados
  add column if not exists material_url text;     -- contenido post-taller / material
-- Satisfacción sobre 10 (hoy no hay talleres cargados: no hay datos que convertir)
alter table public.workshops drop constraint if exists workshops_rating_chk;
alter table public.workshops add constraint workshops_rating_chk
  check (rating is null or (rating >= 0 and rating <= 10));

-- Recomendaciones de taller
alter table public.workshops_recommended
  add column if not exists audience text check (audience in ('lideres','colaboradores')),
  add column if not exists format   text,         -- "Ciclo de 3 encuentros · uno por mes"
  add column if not exists reason   text;         -- el dato de motivos que lo justifica

-- Contenidos
alter table public.content
  add column if not exists category text
    check (category in ('protocolo','lideres','colaboradores','mensual','beneficio')),
  add column if not exists format      text,      -- "Guía · PDF", "Video · 6 min", "Noviembre"
  add column if not exists description text;

-- ── 7. Seguridad por filas (mismo esquema que el resto de las tablas) ──
alter table public.sessions_by_coupon    enable row level security;
alter table public.encuesta_popup        enable row level security;
alter table public.reuniones_semestrales enable row level security;
alter table public.content_feedback      enable row level security;
alter table public.sync_runs             enable row level security;
alter table public.company_coupons       enable row level security;

drop policy if exists admin_all on public.sessions_by_coupon;
create policy admin_all on public.sessions_by_coupon    for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists admin_all on public.encuesta_popup;
create policy admin_all on public.encuesta_popup        for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists admin_all on public.reuniones_semestrales;
create policy admin_all on public.reuniones_semestrales for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists admin_all on public.content_feedback;
create policy admin_all on public.content_feedback      for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists admin_all on public.company_coupons;
create policy admin_all on public.company_coupons       for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists admin_all on public.sync_runs;
create policy admin_all on public.sync_runs             for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists company_read on public.sessions_by_coupon;
create policy company_read on public.sessions_by_coupon    for select to authenticated using (company_id in (select my_company_ids()));
drop policy if exists company_read on public.encuesta_popup;
create policy company_read on public.encuesta_popup        for select to authenticated using (company_id in (select my_company_ids()));
drop policy if exists company_read on public.reuniones_semestrales;
create policy company_read on public.reuniones_semestrales for select to authenticated using (company_id in (select my_company_ids()));
-- Feedback: la empresa ve el suyo y puede dejar el suyo (única escritura del dash además de solicitar_consultoria)
drop policy if exists company_read on public.content_feedback;
create policy company_read on public.content_feedback for select to authenticated using (company_id in (select my_company_ids()));
drop policy if exists company_insert on public.content_feedback;
create policy company_insert on public.content_feedback for insert to authenticated
  with check (
    company_id in (select my_company_ids())
    and content_id in (select id from public.content where company_id = content_feedback.company_id)
    and user_email = lower(coalesce(auth.jwt()->>'email',''))
  );

-- ── 8. Visibilidad por empresa: nombres nuevos de pestañas ──
-- Colaboradores suma "Motivos de consulta" donde ya se veía Sesiones o Adherencia
update public.companies
set visible_modules = jsonb_set(visible_modules, '{individual}',
      (visible_modules->'individual') || '["Motivos de consulta"]'::jsonb)
where visible_modules ? 'individual'
  and jsonb_array_length(visible_modules->'individual') > 0
  and not (visible_modules->'individual') ? 'Motivos de consulta';
-- Gestión pasa a ser una sola página ("Resumen") donde estaba habilitada
update public.companies
set visible_modules = jsonb_set(visible_modules, '{gestion}', '["Resumen"]'::jsonb)
where visible_modules ? 'gestion'
  and jsonb_array_length(visible_modules->'gestion') > 0;

commit;

-- Verificación rápida después de aplicar:
--   select table_name from information_schema.tables where table_schema='public'
--     and table_name in ('sessions_by_coupon','encuesta_popup','reuniones_semestrales','content_feedback','sync_runs');
--   select name, visible_modules from companies order by name;
