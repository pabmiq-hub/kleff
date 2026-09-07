# Salir de los créditos de base de datos e IA de Lovable

Objetivo: que KLEFF funcione con tu propia cuenta de Supabase y con tu propia clave de Google AI (Gemini), manteniendo la web publicada en Lovable y el dominio kleff.es tal cual.

## Qué cambia y qué no

- La web, el diseño y todas las funciones siguen igual.
- Los datos (usuarios, juegos, inscripciones, eventos, karma, contenidos) pasan a tu cuenta de Supabase.
- Las traducciones automáticas y los textos asistidos pasan a usar Gemini con tu clave de Google AI Studio (capa gratuita amplia; luego pago por uso muy bajo).
- El proyecto de Lovable Cloud sigue existiendo pero queda sin uso, así deja de consumir.

## Parte 1 — Base de datos

### Antes del corte (sin afectar a la web)
1. Creas el proyecto en Supabase (región Europa, plan que elijas) y me pasas: URL del proyecto, clave pública, clave de servicio y la cadena de conexión a la base de datos. Las guardo como secretos, nunca en el código.
2. Copio la estructura completa: tablas, vistas, funciones, disparadores, permisos y reglas de acceso, además de las extensiones que usamos (colas de correo, tareas programadas, cifrado del documento de identidad).
3. Hago una copia de prueba de los datos y verifico que todo cuadra (recuentos por tabla) sin tocar la web en producción.

### Noche del corte (30–60 min)
4. Pongo la web en modo solo lectura (avisos de "mantenimiento" en formularios e inscripciones).
5. Copio los datos definitivos, incluidas las cuentas de acceso y los archivos subidos (avatares, imágenes de medios, adjuntos de inscripciones).
6. Cambio la configuración de la web para que apunte a tu Supabase.
7. Reconfiguro en el nuevo proyecto: acceso con Google, direcciones de retorno del inicio de sesión (kleff.es y la vista previa), correos de acceso, tareas programadas (sincronización con BGG, limpieza semanal, cola de correos) y los buckets de archivos con sus permisos.
8. Pruebas conjuntas: entrar con Google, alta en un formulario con correo de confirmación, préstamo de juego, panel de admin, página pública de un evento.
9. Quito el modo solo lectura.

### Riesgo conocido
Las contraseñas de las cuentas creadas con correo y contraseña solo se pueden trasladar si la copia incluye las credenciales cifradas. Lo compruebo en el paso 3: si no fuera posible, quienes entran con Google no notan nada y al resto se les envía un correo de "restablecer contraseña". Te confirmo cuál de los dos casos es antes de la noche del corte.

## Parte 2 — Dejar la IA de Lovable

1. Creas una clave en Google AI Studio (gratis) y me la pasas; la guardo como secreto.
2. Cambio los cuatro puntos donde hoy se llama a la IA de Lovable (traducción de contenidos editables, blog, bloques de página y secciones) para que llamen a Gemini directamente con tu clave.
3. Dejo un aviso claro en el panel si la clave falta o se agota, para que nunca se pierda un texto por un fallo de traducción.
4. Las imágenes generadas en el editor no se ven afectadas (no se usan en la web publicada).

## Detalles técnicos

- Volcado con `pg_dump` (esquemas `public`, `auth`, `storage`) desde la cadena de conexión actual y restauración en el proyecto nuevo; extensiones `pg_cron`, `pg_net`, `pgmq`, `pgsodium`, `vector` si aplica.
- Los archivos de los tres buckets (`avatars`, `media`, `registration-uploads`) se copian con un script vía API de Storage, conservando rutas.
- La app lee las claves desde variables de entorno propias (`APP_SUPABASE_*`) con prioridad sobre las generadas por Lovable, de modo que el cliente del navegador, el cliente de servidor y el de servicio apuntan al proyecto nuevo.
- Las tareas de `pg_cron` que llaman a URLs (`/lovable/email/queue/process`, sincronización BGG) se recrean apuntando a kleff.es con la nueva clave de servicio.
- La clave de cifrado de documentos de identidad (`kleff_id_document_key`) se recrea en el nuevo proyecto; si no se puede exportar, los documentos guardados habría que volver a cargarlos (te confirmo el alcance real en el paso 3).
- La IA pasa a `generativelanguage.googleapis.com` (modelo `gemini-2.5-flash`) con la misma estructura de llamadas actual.
- Los envíos de correo siguen con Resend, sin cambios.
