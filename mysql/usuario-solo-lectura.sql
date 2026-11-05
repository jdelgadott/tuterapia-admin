-- Usuario de SOLO LECTURA para la sincronización con el dash de empresas.
-- Permisos por COLUMNA: puede leer únicamente lo necesario para calcular totales.
-- NO puede leer nombres, apellidos, mails, teléfonos, pagos ni comentarios, ni modificar nada.
-- Probado sobre la estructura del dump del 9 ene 2026 (MariaDB 10.6).
-- Reemplazar <CONTRASEÑA LARGA> antes de correrlo. La contraseña NO se manda por chat ni mail.

CREATE USER 'tt_dash_sync'@'%' IDENTIFIED BY '<CONTRASEÑA LARGA>' REQUIRE SSL;

GRANT SELECT (id, codigo)                                        ON tuterapiaweb.cupones                       TO 'tt_dash_sync'@'%';
GRANT SELECT (id_paciente, id_cupon, id_pago)                    ON tuterapiaweb.pacientes_cupones             TO 'tt_dash_sync'@'%';
GRANT SELECT (id, id_paciente, id_pago, fecha, realizada, tipo_session) ON tuterapiaweb.sesiones                TO 'tt_dash_sync'@'%';
GRANT SELECT (id_paciente, primera_vez)                          ON tuterapiaweb.pacientes_decisiones          TO 'tt_dash_sync'@'%';
GRANT SELECT (idEtiqueta, idPacienteDecisiones)                  ON tuterapiaweb.paciente_decisiones_etiquetas TO 'tt_dash_sync'@'%';
GRANT SELECT (id, titulo)                                        ON tuterapiaweb.etiquetas_decisiones          TO 'tt_dash_sync'@'%';

FLUSH PRIVILEGES;

-- Si el servidor todavía no tiene SSL configurado, quitar "REQUIRE SSL" solo para la prueba
-- y poner MYSQL_SSL=false en Vercel. Para producción, conviene habilitar SSL.
