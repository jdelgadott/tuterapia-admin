# Rediseño dash de empresas: cómo pasarlo a producción

Todo está probado: los parches aplican limpio sobre el `main` actual de cada repo (3 nov 2026), las dos apps compilan, la migración se probó en un Postgres local (dos veces seguidas) y la sincronización se probó en una MariaDB local con la misma estructura de la plataforma.

## Qué hay en esta carpeta

| Archivo | Qué es |
| --- | --- |
| `supabase/20261103_rediseno_dash.sql` | Cambios de la base. Todo aditivo: no borra ni renombra nada que use producción |
| `supabase/functions/enviar-recordatorio/` | Edge Function nueva para el recordatorio de pago (reemplaza la clave de Resend que estaba en el navegador) |
| `mysql/usuario-solo-lectura.sql` | Usuario de solo lectura para la MySQL, con permisos por columna |

Los cambios del admin ya están aplicados en este repo (rama `rediseno-2026`). El parche del dash todavía no: está sin aplicar en `~/Desktop/rediseno-dash-empresas/dash.patch` y va al repo `tuterapia-dashempresa`.

## Orden (cada paso necesita el anterior)

### 0. La clave de Resend
La clave estaba escrita en `src/App.jsx` (función `sendReminder`), o sea en el código que baja el navegador y en el historial del repo. **Verificado el 3 nov 2026: esa clave ya no sirve** — la API de Resend la rechaza con 401, así que no hay nadie pudiendo mandar mails con ella. No hace falta revocarla.

Lo que sí falta, para que el botón de recordatorio vuelva a funcionar:
1. Resend → API Keys → crear una clave nueva.
2. Supabase → Edge Functions → Secrets → `RESEND_API_KEY` = la nueva.
3. Subir la función: `supabase functions deploy enviar-recordatorio --project-ref cdzvjueschflpkxlozby` (o pegarla desde el panel de Edge Functions).

Hasta que esté la clave nueva, el botón "✉ Recordatorio" va a dar error. Ya no manda nada desde el navegador: llama a la Edge Function, que valida contra `admin_users` y arma el mail con datos de la base.

### 1. Base de datos (Supabase) — ✅ hecho (3 nov 2026)
Aplicada como migración `rediseno_dash_2026`. Verificado: las seis tablas nuevas existen, todas con RLS y sus políticas; las columnas nuevas están en `workshops`, `workshops_recommended` y `content`; el linter de seguridad no tiró nada nuevo.

El paso 8 tocó datos: las once empresas sumaron "Motivos de consulta" a Colaboradores, y Greycon pasó Gestión de `["Facturación"]` a `["Resumen"]`. Era el único con Gestión configurada.

### 2. Admin — ✅ hecho (3 nov 2026)
El parche ya está aplicado y commiteado en la rama `rediseno-2026` de este repo. El build de Vite pasa limpio.
- Vercel arma la vista previa de la rama. Probar ahí; después merge a `main`.
- Variables de entorno: ya están en Preview. Para producción, marcarlas también en **Production**, con `SYNC_DRY_RUN=true` todavía.
- El cron (`vercel.json`) corre todos los días 06:17 UTC (03:17 Uruguay) y **solo en producción**. En la vista previa se prueba con el botón "Sincronizar ahora" (menú Sincronización).

### 3. MySQL
Si todavía no está creado el usuario: correr `mysql/usuario-solo-lectura.sql` con una contraseña nueva y cargarla en Vercel (`MYSQL_PASSWORD`). Si el servidor no tiene SSL, sacar `REQUIRE SSL` y poner `MYSQL_SSL=false`.

### 4. Cupones y prueba de números
1. Admin → cada empresa → Configuración → **Cupones de la plataforma**: cargar sus códigos (tal cual en `cupones.codigo`).
2. Menú **Sincronización** → "Sincronizar ahora". En modo prueba no escribe nada: muestra, empresa por empresa, las diferencias contra lo cargado hoy.
3. Revisar los números con el equipo. Si cierran: `SYNC_DRY_RUN=false` en Production y redeploy.

### 5. Dash
```bash
git checkout -b rediseno-2026
git apply ~/Desktop/rediseno-dash-empresas/dash.patch
git add -A && git commit -m "Rediseño 2026 del dash de empresas"
git push -u origin rediseno-2026
```
Probar la vista previa de Vercel con una empresa real (vista admin) y hacer merge a `main`.

### 6. Verificar producción
Por el incidente de julio: confirmar que el bundle publicado tiene los cambios (por ejemplo, buscar "Cómo lo ven los líderes y el equipo" en el JS servido del dash, y "Sincronización con la plataforma" en el del admin).

## Qué tener en cuenta
- Las secciones nuevas aparecen vacías (con su estado vacío) hasta que se carguen datos: talleres, contenidos con sección, encuesta emergente, reuniones.
- Los contenidos que ya existen sin "sección" se ven en el dash como "Otros recursos" hasta que se les asigne una en el admin.
- El dash solo escribe en una tabla nueva: `content_feedback` (el "¿Te sirvió? ★" de RRHH), protegida por RLS.
- Todo el código de vista previa (`IS_PREVIEW`) queda apagado en producción: Vite lo elimina del build.
