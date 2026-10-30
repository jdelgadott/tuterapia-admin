# Tu Terapia — Panel Admin B2B

## Qué es este proyecto
Panel interno del equipo B2B de Tu Terapia para gestionar los datos que alimentan el dashboard de empresas (tuterapia-empresas.com). Desde acá se cargan sesiones, talleres, motivos de consulta, hitos, facturación, el equipo TT y los accesos de cada empresa cliente.

- **Producción:** https://tuterapia-admin.vercel.app (Vercel, autodeploy desde `main`)
- **Repo:** jdelgadott/tuterapia-admin
- **Todo el código vive en `src/App.jsx`** (single-file app, ~1750 líneas)
- **Proyecto hermano:** tuterapia-dashempresa (el dashboard que consume estos datos)

> Si recién llegás al proyecto: leé primero el `ONBOARDING.md` del repo hermano. Este archivo es la referencia técnica.

## Stack
- React + Vite
- Supabase (proyecto `cdzvjueschflpkxlozby`, región São Paulo): PostgreSQL + Auth + Storage
- Vercel para deploy
- Edge Functions: `invite-user` (alta de usuarios), `delete-user` (purga de cuentas Auth)

## Flujo de trabajo
- `npm run dev` para local (puerto 5173)
- Deploy: commit + push a `main` → Vercel autodeploya
- Acceso: solo mails registrados en `admin_users` (hoy: jdelgado@, firoldi@, imazzilli@tuterapia.com.uy)

## Cuatro cosas que muerden y conviene saber antes de empezar

1. **Hay MUCHOS bloques de JSX idénticos entre componentes.** El bloque `<Btn small onClick={save}>Guardar</Btn>...Cancelar` aparecía 8 veces. Un buscar-y-reemplazar sin verificar pisó las 8 y dejó `editingId`/`resetForm` sin definir en 7 pestañas → **pantalla en blanco** al abrir sus formularios (Sesiones, Contenido, Motivos, Recomendaciones, Hitos, Encuestas, Facturación). **Regla: verificar que el texto a reemplazar aparezca UNA sola vez, o reemplazar por número de línea.** El build de Vite NO detecta estas variables no definidas — hay que abrir cada pestaña.
2. **Push ≠ deployado.** Vercel tuvo un incidente (jul 2026) que dejó builds sin publicar pese a un push exitoso. Verificar siempre el bundle de producción después de pushear.
3. **El proyecto de Supabase es Free tier y se pausa solo por inactividad** (~7 días). Ya pasó dos veces. Síntoma: los dos paneles dejan de aceptar logins a la vez, con el mensaje "email o contraseña incorrectos". No es el código — hay que restaurar desde el dashboard de Supabase.
4. **La base es producción y no hay ambiente de prueba.** Cuidado con deletes y updates masivos. Antes de crear datos de prueba, preguntar.

## Estructura del panel (v15)
Menú global: **Dashboard · Empresas · Talleristas · Equipo TT · Tracking**

Dentro de cada empresa:
- Configuración (plan, consultoría, referente, headcounts, frecuencia de encuestas, visibilidad de módulos)
- Accesos al dashboard (usuarios + permisos por módulo, invitaciones por mail vía `invite-user`)
- COLABORADORES: Sesiones (form manual + importación CSV)
- CULTURA: Talleres · Contenido
- ESTRATEGIA: Motivos (form + importación CSV) · Recomendaciones · Hitos · Encuestas · Informes · Textos
- GESTIÓN: Facturación

## Equipo TT (vista propia)
`admin_users` es la fuente ÚNICA del equipo: un miembro = admin del panel = posible referente de empresas. La vista **Equipo TT** hace el CRUD completo con perfil (short_name, role, phone, whatsapp, calendar_url, initials, area, photo_url, active, is_referente), sube la foto a `contenido/equipo/<id>.<ext>` e invita automáticamente al panel vía `invite-user`.

El selector de referente en Configuración se carga de esta tabla (`is_referente` + `active`). **Ya no hay ninguna lista de referentes hardcodeada.** Antes era texto libre y un typo en un mail hizo que Genexus mostrara a la persona equivocada durante semanas. Al borrar un miembro se bloquea si es referente de alguna empresa.

## Importación CSV (funcionalidad crítica)
El equipo llena templates Excel → exporta CSV (separador `;`, UTF-8 con BOM) → sube desde el panel.

**Parser de sesiones:** detecta la fila header buscando "Empresa"+"Mes"; posiciones fijas de columnas: 0=Empresa, 1=Mes, 2=Año, 3=Canjeadas, 4=Realizadas, 8=Nuevos, 9=Activos, 10=TotalHistórico, 11=PrimeraVez, 14=Parcial. Upsert con onConflict "company_id,month,year" (requiere el constraint unique en Supabase). Maneja BOM, comillas y saltos de línea dentro de celdas.

**Parser de motivos:** header donde col0="empresa" y col1 contiene "motivo"; columnas fijas: 1=Motivo, 2=Cantidad, 3=%, 4=Período. Salta filas TOTAL/instrucciones/📌. Borra los motivos existentes de la empresa y reinserta.

**Historial de bugs de estos parsers:** leyeron la columna equivocada (Empresa en vez de Motivo), tomaron la fila de título como header, y fallaron con headers multilínea entre comillas. Si se tocan, **probar con los templates reales antes de deployar.**

## Borrados: lo que limpia y lo que no
- **Borrar una empresa** se lleva sus datos de las 17 tablas por cascada (`ON DELETE CASCADE` en todas las FKs, jul 2026) **y además borra sus archivos** de los buckets `contenido`, `facturas` e `informes`. Esto último hubo que agregarlo a mano: las cascadas de la base NO alcanzan a Storage, y `storage.objects` no admite DELETE por SQL (Supabase lo bloquea, hay que usar la Storage API). Cuando se borró TCS quedaron 6 archivos huérfanos.
- Las carpetas `equipo/` y `talleristas/` de Storage **no son de empresas** — nunca tocarlas al limpiar.
- **Borrar un usuario** purga también su cuenta de Auth si no le quedan empresas (Edge Function `delete-user`), así el mail queda libre para recrearse. Nunca purga mails que estén en `admin_users`.
- **Invitar un mail que ya tiene cuenta** no reinvita: solo agrega la fila y la persona entra con su contraseña de siempre.

## Talleres
Se pueden **crear y editar** (botón ✏️ por fila, el form se reusa en modo edición). Campos de costo: `cost` en UYU y `cost_usd` como referencia — se facturan en USD y se pasan a pesos a mano para no distorsionar los históricos. Precio base de lista: USD 600 + IVA 22%, con descuentos del 10% al 25% según el convenio de la empresa.

## Tipos de plan
`companies.plan_kind`: `cuponera_fija | fee_fijo | a_demanda` (son **tres**), con campos condicionales `monthly_plan` (cuponera), `monthly_fee` (fee fijo), `monthly_cap` (a demanda), `coverage_pct`, `renewal`. **Los talleres NO son un plan** — son acciones complementarias. Al guardar sincroniza los campos legacy `plan_type`/`plan_coverage`.

Visibilidad por empresa: toggles de módulos Y subpestañas → `companies.visible_modules` jsonb `{módulo:[subs]}`, null = todo visible. **Los nombres de subs en `ALL_MODULES` deben coincidir EXACTO con `MODULES` del dashboard** — son las claves de matching.

## Tablas Supabase
`companies`, `company_users`, `user_permissions`, `sessions_data`, `workshops`, `workshops_recommended`, `content`, `billing`, `roi_by_quarter`, `recommendations`, `milestones`, `page_views`, `nps_data`, `admin_users`, `consultation_reasons`, `informes`, `encuestas_archivos`, `header_texts`, `talleristas`, `encuesta_respuestas`, `seguimiento_beneficio`

Campos clave `sessions_data`: canjeadas, realizadas, nuevos, activos, total_historico, primera_vez, c1–c5, partial, month ("Ago"), year. Unique(company_id, month, year).

**RLS habilitado en todas las tablas:** los admins operan vía políticas basadas en `admin_users` (helper `is_admin()`). La service role key fue eliminada del cliente y las claves legacy están deshabilitadas — ambas apps usan la publishable key.

**Ojo con `total_historico`:** es la fuente de verdad para el conteo de personas en el dash. Tiene que ser acumulado y no bajar nunca. Si se carga mal un mes, el dash muestra el número equivocado en todos lados.

## Clientes (al 30 oct 2026)
Nueve empresas con datos: ANII, Genexus Consulting, Greycon, Nodum y Uruware (fee fijo); Kaizen, Quanam y Qubika (a demanda); Farmashop (a demanda 100%, sin datos todavía).

- **No hay ninguna empresa con cuponera fija hoy.** TCS dejó de ser cliente en sep 2026 y se eliminó por completo.
- **BigCheese es data de prueba del equipo** — no usarla para validar nada.
- `billing` y `workshops` están vacías; `company_users` también (el equipo entra al dash por la vista admin, con su cuenta de `admin_users`).

## Convenciones
- **Idioma de la UI: español rioplatense con voseo.** "Podés", "tenés", "ingresá". Nunca "puedes".
- Colores (paleta vieja; el rebrand 2026 se aplicó al dash y acá quedó pendiente): primary #1A5C4A, lighter #E6F4F0, bg #F5F7F6, colIndividual #4a9356, colColectivo #5040A0, colEstrategico #2a6aaa, colGestion #607870, border #DDE8E4, text #18211E, textMuted #607870
- Estilos inline, no hay CSS framework.

## Pendientes conocidos
- Aplicar el rebrand 2026 al panel (hoy usa la paleta vieja).
- Reconfirmar que el toggle de encuesta funciona (se le agregó manejo de error visible, falta validar con un caso real).
- El objeto `titles` (header de la vista) no tiene entrada para `equipo`, así que esa pestaña muestra el título vacío.
