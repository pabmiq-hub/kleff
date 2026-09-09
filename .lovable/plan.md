# Terminar la migración a tu Supabase propio (versión simplificada)

## Qué acabo de descubrir

- Los 6 usuarios migrados tienen proveedor `email`. Ninguno usa Google OAuth.
- Por tanto, no hace falta configurar Google Cloud Console ni credenciales de Google.
- El acceso seguirá funcionando con correo y contraseña, exactamente como hoy.

## Objetivo

Que la web de KLEFF apunte a tu proyecto de Supabase propio para datos y autenticación, sin depender de los créditos de base de datos de Lovable. La IA propia con Gemini ya está hecha.

## Pasos que quedan

### 1. Apuntar la web a tu Supabase

Usar las credenciales que ya guardaste (`APP_SUPABASE_*`) para que el cliente del navegador, el cliente de servidor y el cliente de servicio conecten con tu proyecto nuevo.

- Si es posible, actualizar las variables `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en la configuración del entorno de Lovable (no en el código).
- Si no se pueden tocar esas variables, crear un envoltorio que lea `APP_SUPABASE_*` con prioridad, sin modificar los archivos auto-generados de `src/integrations/supabase/`.

### 2. Reconfigurar tareas automáticas

En tu nuevo proyecto de Supabase hay que volver a crear:

- Las tareas `pg_cron` que llaman a URLs: sincronización con BGG, limpieza semanal y cola de correos.
- Las direcciones a las que apuntan deben ser `https://kleff.es` (publicado) y la URL del preview.
- La clave de servicio que usan es la de tu proyecto nuevo.

### 3. Verificar correos

- Los envíos siguen usando Resend, igual que ahora.
- Comprobar que el dominio de envío sigue autorizado en Resend y que las plantillas se envían correctamente.

### 4. Pruebas

- Entrar con un usuario existente por correo y contraseña.
- Acceder al panel de admin.
- Probar una inscripción pública con email de confirmación.
- Probar el préstamo de un juego.
- Probar una página pública de evento Konektum.

### 5. Publicar

- Subir los cambios a producción.
- Confirmar que `kleff.es` usa tu Supabase.
- Monitorizar errores durante 24-48 h.

## Qué NO se hace ahora (se puede añadir después)

- Configurar inicio de sesión con Google. Si más adelante lo quieres, entonces sí hará falta Google Cloud Console, pero no es necesario hoy.

## Riesgo de las contraseñas

Las contraseñas de los usuarios de correo/contraseña se migran con sus hashes si el volcado fue completo. Si algún usuario no puede entrar, se le envía un enlace de "restablecer contraseña" desde el login.
