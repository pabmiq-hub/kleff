## Objetivo
Permitir crear, editar y guardar publicaciones del blog sin que aparezca el error `Cannot read properties of undefined (reading 'bind')`, manteniendo la subida de imagen de cabecera y el editor con imágenes/pies de foto.

## Plan de implementación

1. **Sustituir el saneado HTML problemático**
   - Reemplazar el uso de la dependencia que falla en el entorno del backend por un saneador HTML compatible.
   - Mantener la misma función pública `sanitizeHtml(input)` para no tocar todos los llamadores.
   - Permitir etiquetas necesarias del editor: párrafos, titulares, listas, enlaces, imágenes, `figure` y `figcaption`.
   - Bloquear contenido inseguro: scripts, estilos, iframes no permitidos, eventos `on*` y URLs peligrosas.

2. **Revisar el guardado del blog**
   - Ajustar `adminUpdateBlogPost` y/o el formulario si hace falta para que el error real se muestre con claridad.
   - Confirmar que al pulsar **Guardar cambios** los datos persisten.
   - Confirmar que al pulsar **Guardar + traducir** primero guarda y después traduce ES → CA/EN.

3. **Estabilizar el editor si el error persiste**
   - Simplificar la configuración de extensiones de Tiptap para evitar duplicidades.
   - Mantener el botón de imagen normal y el botón de imagen con pie.
   - No cambiar el diseño del editor salvo lo imprescindible.

4. **Verificación**
   - Probar el flujo de crear/editar publicación desde admin.
   - Verificar que la imagen de cabecera puede subirse desde dispositivo.
   - Verificar que el contenido con enlaces, imágenes y pies se guarda sin desaparecer.

## Resultado esperado
El blog debe permitir publicar posts normalmente: guardar, añadir imagen de cabecera, insertar imágenes con pie y usar traducción automática sin que se pierdan cambios ni aparezca el error actual.