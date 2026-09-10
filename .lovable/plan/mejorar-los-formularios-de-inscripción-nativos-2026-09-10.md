# Mejorar los formularios de inscripción nativos

Rediseño de la ficha del evento (descripción, datos destacados, información legal) y arreglo de las preguntas de invitados y de juegos.

## 1. Descripción con editor completo

- La descripción pasa a ser un editor enriquecido igual al del blog y al de Konektum: negrita, cursiva, subrayado, títulos, listas, alineación, enlaces, citas, imágenes y tablas.
- En la página pública la descripción se muestra con ese formato (no como texto plano).
- Se conserva lo ya escrito: el texto actual se convierte a párrafos al abrir el editor.

## 2. Bloque de datos destacados

Debajo de la descripción aparece un recuadro con las categorías, cada una con su emoji:

```text
📍 Lugar: Cafeteria Japonesa Kasa Hanaka – Bar Mas Guinardó
💶 Precio: Entrada gratuita. Consumiciones a cargo de los asistentes.
🗓 Fecha: Sábado 26 de septiembre, 18h a 22:00h
👥 Plazas: 40 plazas
🗣 Idiomas: Castellano, catalán e inglés
```

- En Ajustes se edita cada fila: emoji, etiqueta y texto; se pueden reordenar, añadir filas nuevas y ocultar las que no apliquen.
- Al crear un formulario, las filas de fecha, lugar y plazas se rellenan solas con los datos del evento; el administrador puede sobrescribirlas.

## 3. Información legal

- Nuevo bloque "Información legal" con un texto por defecto ya redactado (protección de datos, imágenes, condiciones de asistencia).
- Se muestra al final de la ficha pública, en tamaño pequeño y plegable.
- En Ajustes se edita con un lápiz que abre el editor de texto; se puede restaurar el texto por defecto o desactivar el bloque.

## 4. Preguntas totalmente manuales

- El campo "Email de contacto" deja de estar fijo: se crea como una pregunta más (tipo email, obligatoria) para poder cambiar su texto, orden y ayuda. En formularios existentes se crea automáticamente para no perderlo.
- Desaparece el campo de invitados automático: si se quieren invitados, se añade la pregunta correspondiente.
- El orden de la ficha pública es exactamente el orden de la lista de preguntas.

## 5. Arreglo de la pregunta de invitados

Ahora falla porque el valor elegido no se guarda donde se valida, así que el envío dice que falta la respuesta. Se corrige para que la selección cuente como respondida y sume plazas correctamente (invitados + inscrito).

## 6. Arreglo de la pregunta de juegos

- Pasa a buscar en la misma base de juegos que "Juegos favoritos" del perfil de socio, con portada del juego y selección por clic (no texto libre).
- Se guarda el juego elegido (nombre e identificador) y se ve así en la lista de inscritos y en los correos.
- Sigue disponible la opción de limitar la pregunta hasta el miércoles previo a las 19:00.

## Detalles técnicos

- Nuevas columnas en `registration_forms`: `description_html`, `highlights` (jsonb: emoji/etiqueta/texto/orden), `legal_info_html`, `legal_info_enabled`. Migración aplicada tanto al proyecto gestionado como al Supabase propio (`APP_SUPABASE_DATABASE_URL`).
- Público: `PublicRegistrationPage` y `EmbeddedRegistrationForm` renderizan HTML saneado (`sanitize.server.ts`) para descripción e información legal.
- Admin: `admin.registrations.$id.tsx` usa `RichTextEditor` y un editor de filas destacadas; las preguntas siguen en Ajustes.
- Pregunta invitados: el valor se escribe también en `values[q.id]`; `submitRegistration` sigue recibiendo `guests`.
- Pregunta juegos: nueva server function pública que reutiliza `searchLudoyaBoardgames` (ya usada por el perfil), con caché corta y límite de 10 resultados; se guarda `{ id, name, imageUrl }`.
