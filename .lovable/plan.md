
# Plan de cambios

Trabajo dividido en 5 bloques. Cada uno se puede aprobar/ejecutar de forma independiente.

---

## Bloque A — Inscripciones: monolingüe + upload + flujo "form vs enlace" + slug en raíz

### A.1 Migración: simplificar a un solo idioma
- Eliminar columnas `title_ca, title_en, description_ca, description_en, confirmation_message_ca, confirmation_message_en` de `registration_forms`.
- Renombrar `title_es → title`, `description_es → description`, `confirmation_message_es → confirmation_message`.
- En `registration_questions`: eliminar `label_ca, label_en, help_ca, help_en` y renombrar `label_es → label`, `help_es → help`.
- Eliminar también `options.label_es/ca/en` del JSON `options` → solo `value` + `label`.
- Añadir columna `kind text not null default 'form' check (kind in ('form','external'))` para fijar la decisión inicial.

### A.2 Subida de imagen de cabecera
- Sigue siendo `cover_image_url text`, pero el editor lo gestiona con un **uploader** a `storage://media/registrations/<form-id>/<uuid>.<ext>` (bucket público existente).
- Server function nueva `adminUploadRegistrationCover` (multipart) o usar el patrón actual: subida directa desde el cliente con `supabase.storage.from('media').upload(...)` + guardar URL pública.
- Validar tamaño ≤ 5 MB y tipo `image/*`.

### A.3 Diálogo "Nueva inscripción" en dos pasos
- Paso 1: elegir `kind` (Formulario nativo / Enlace externo) — tarjetas grandes.
- Paso 2: pedir `slug` + `título` (+ `url externa` si kind=external).
- El editor de la inscripción muestra pestañas distintas según `kind`:
  - `form`: pestañas Ajustes / Preguntas / Inscritos (actual).
  - `external`: pestañas Ajustes (modo redirect|iframe + URL) / Estadísticas (clics).

### A.4 Slug en raíz `kleff.es/<slug>`
- Borrar la ruta `src/routes/inscripcion.$slug.tsx`.
- Añadir redirect 301 de `/inscripcion/<slug>` → `/<slug>` (vía `content_redirects` o regla en `$.tsx`).
- En `src/routes/$.tsx`, el orden de resolución pasa a ser:  
  `built-in → inscripción (kind=form: render in-place; kind=external+iframe: embed; kind=external+redirect: 301) → CMS page → blog post → 404`.
- Validación al crear inscripción / página CMS: el slug no puede coincidir con rutas built-in (lista cerrada: `app, admin, login, super-admin, blog, medios, ludoteca, contacto, …`) ni con un slug ya usado por otra inscripción/página/post.

---

## Bloque B — Redirección post-login del admin

Bug: `login.tsx` evalúa `isSuperAdmin` antes de que los roles se hayan cargado tras `signInWithPassword`, así que el admin acaba en `/app`.

Arreglo:
- En `handleSubmit`, tras `signInWithPassword`, consultar directamente `user_roles` (igual que hace `super-admin.tsx`) y navegar a `/admin` o `/app` con la información ya resuelta, en lugar de depender del efecto que reacciona al contexto.
- Mantener el fallback del efecto para los logins ya iniciados (cookie persistente).

---

## Bloque C — CMS: gestionar páginas (lápiz / ojo / papelera)

En `admin.content.index.tsx`:
- Sustituir la fila actual por una con 3 acciones a la derecha:
  - Lápiz (Editar) → `/admin/pages/$pageId` (custom) o `<path>?edit=1` (builtin).
  - Ojo (Ver) → abre `page.path` en nueva pestaña.
  - Papelera (Eliminar) → solo en `is_builtin=false`. Confirmación + llamada a nueva server function `adminDeletePage(pageId)`.
- Backend: `adminDeletePage` en `pages.functions.ts`. Borra `content_pages` (cascade a `content_page_blocks`). Requiere super_admin. Bloquear si `is_builtin=true`.

---

## Bloque D — Editor CMS: nuevos bloques

Añadir tipos al `BlockType` y al `BLOCK_LIBRARY`:

| Tipo | Datos |
|---|---|
| `hero` | `{ title, subtitle?, image_url, image_position?, overlay_opacity?, cta_label?, cta_href?, cta_variant? }` |
| `columns` | `{ count: 2\|3, items: [{ html, image_url? }] }` |
| `gallery` | `{ images: [{ url, alt?, caption? }], columns: 2\|3\|4, lightbox: bool }` |
| `cards` | `{ items: [{ image_url?, title, body, cta_label?, cta_href? }], columns: 2\|3 }` |
| `button` | `{ label, href, variant: primary\|secondary\|outline\|ghost, size: sm\|md\|lg, align, full_width }` |

Todos los bloques con imágenes usan el mismo uploader hacia `storage://media/cms/<page-id>/...`.

`BlockRenderer` recibe los nuevos casos. `BlockEditor` añade el formulario por tipo. Sanitización HTML sigue siendo lazy (como ya quedó arreglado).

---

## Bloque E — Diagnóstico: "publico página y no la veo"

Pasos:
1. Reproducir creando una página de prueba (slug `prueba-cms`) y publicándola.
2. Inspeccionar:
   - `resolveCustomPage` filtra `is_builtin=false` y matchea `slug_es` — debe encontrarla.
   - `getPageBlocks` filtra `hidden=false` y `locale=es` — debe devolver los bloques.
   - `$.tsx` solo entra al flujo si `segments.length === 1` y `isPlausibleSlug(...)` (regex `[a-z0-9-]`) → un slug normal pasa.
3. Hipótesis principales a verificar (en este orden):
   - **a.** El catch-all sólo resuelve **un segmento**. Si la página tiene path con `/`, falla. Validar al guardar slug.
   - **b.** `is_published` no se setea correctamente: en `adminCreatePage` queda `false`; tras pulsar "Publicar", `adminTogglePublishedPage` lo actualiza — comprobar en BD que efectivamente se queda en `true`.
   - **c.** Error JS en `CustomPage` por bloque con `data` inválido (p.ej. `image.url` vacío) → ya con bloques vacíos podría reventar el render. Endurecer `BlockRenderer` para tolerar datos parciales.
   - **d.** Si la página tiene **0 bloques publicados**, devolver una página vacía con título en lugar de error.

Acción: instrumentar el catch-all con un log específico (`[$.tsx] custom page resolution: slug=… found=… published=…`) durante el debug y, según el resultado, aplicar el fix correspondiente.

---

## Orden de ejecución recomendado

1. **B** (rápido, 1 fichero).
2. **C** (rápido, añade papelera + delete).
3. **E** (diagnóstico — antes de seguir tocando CMS).
4. **D** (bloques nuevos).
5. **A** (mayor: migración destructiva + cambio de rutas — requiere ventana sin tráfico).

Para A, antes de ejecutar la migración propondré el SQL completo en una llamada de migración separada para que lo apruebes.

---

## Detalles técnicos

- **Bucket**: reutilizamos `media` (público). Prefijos `media/registrations/<form-id>/…` y `media/cms/<page-id>/…`.
- **Rutas built-in reservadas**: extraer de `routeTree.gen.ts` una lista al hacer build y guardarla como `src/lib/reservedSlugs.ts`. Validar slug contra ella.
- **Catch-all `$.tsx`**: nuevo orden `inscripción > CMS > blog`. `kind=external+redirect` lanza `throw redirect({ href, statusCode: 302, reloadDocument: true })`; `kind=external+iframe` y `kind=form` se renderizan in-place con un componente equivalente al actual `inscripcion.$slug.tsx`.
- **Migración A.1**: irreversible. Si quieres puedo añadir un `\copy` de respaldo previo a JSON antes del DROP.

