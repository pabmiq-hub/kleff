
# Plan: CMS avanzado, inscripciones y blog enriquecido

Tres bloques de trabajo independientes que comparten infraestructura (editor de bloques, subida a `media`, traducción ES/CA/EN, panel admin).

---

## 1. CMS visual libre (estilo Notion) por página

### Modelo de datos
Una nueva tabla `content_page_blocks` reemplaza el esquema fijo actual (`content_sections` con secciones predefinidas). Cada página tendrá una lista ordenada de **bloques** por idioma:

- `id`, `page_id` (→ `content_pages`), `locale` (es/ca/en), `position` (int)
- `type`: `heading` | `paragraph` | `image` | `gallery` | `video` | `embed` | `cta` | `columns` | `divider` | `quote` | `accordion` | `card_grid` | `form_embed`
- `data` (jsonb): contenido + estilos del bloque
- `created_at`, `updated_at`

Conservamos `content_pages` (ya tiene slug por idioma). Las páginas builtin existentes (Inicio, Cómo funciona, etc.) seguirán con su componente React; el nuevo editor de bloques aplica a páginas **custom** creadas desde admin.

### Editor `/admin/content/$pageKey/editor`
- Lista vertical de bloques con drag&drop (`@dnd-kit/sortable` — ya compatible).
- Botón "+" entre bloques que abre paleta de tipos.
- Cada bloque tiene barra de acciones: mover, duplicar, borrar, ocultar.
- Edición inline:
  - Texto: editor rich-text (Tiptap) con negrita, cursiva, links, listas, H2/H3.
  - Imagen: subida a bucket `media` (ya existe), alt text, ancho (full/contenido), pie de foto.
  - Embed: URL (YouTube, Vimeo, Instagram, iframe genérico con allowlist).
  - CTA: texto + URL + variante (primary/secondary).
  - Columnas: 2 ó 3 sub-zonas que aceptan los mismos bloques.
- Selector de idioma arriba (ES/CA/EN) con botón "copiar desde ES" para acelerar traducción.
- Guardado por bloque (autoguardado tras 800 ms de inactividad) + indicador.

### Renderizado público
Nuevo componente `<BlockRenderer>` montado en la ruta dinámica de páginas custom. Resolución por slug-por-idioma con la lógica que ya existe en `urls.functions.ts`.

### Slugs por idioma
Ya existe (`/admin/content/urls`). Lo integraremos en la misma vista del editor: pestaña "URLs" dentro del editor de cada página, en vez de página aparte.

---

## 2. Inscripciones (Forms nativo + panel)

Nuevo módulo independiente accesible desde el sidebar admin como **"Inscripciones"**.

### Modelo de datos
```text
registration_forms
  id, slug, title_es/ca/en, description_es/ca/en (rich text),
  cover_image_url, status (draft/open/closed),
  max_responses (nullable), opens_at, closes_at,
  confirmation_message_es/ca/en (rich text),
  notify_emails (text[]),          -- a quién avisar de cada inscripción
  external_url (nullable),         -- modo "embed/redirect externo"
  external_mode ('redirect'|'iframe'|null),
  payment_required (bool), payment_amount_cents, payment_currency,
  created_at, updated_at

registration_questions
  id, form_id, position, type, label_*, help_*, required, options (jsonb), validation (jsonb)

  type ∈ short_text | long_text | single_choice | multi_choice | dropdown
       | file_upload | linear_scale | rating | date | time | email | phone | number

registration_responses
  id, form_id, submitted_at, respondent_email, respondent_name,
  answers (jsonb {question_id: value}),
  payment_status ('pending'|'paid'|'refunded'|'waived'),
  payment_marked_by, payment_marked_at, payment_notes,
  internal_notes, status ('new'|'confirmed'|'cancelled')

registration_files            -- referencias a archivos subidos en respuestas
  id, response_id, question_id, storage_path, original_name, size, mime
```

Bucket Storage: nuevo `registration-uploads` (privado, RLS).

### Admin
- `/admin/registrations` → lista de formularios (estado, nº inscritos, pagos pendientes).
- `/admin/registrations/$id/edit` → editor estilo Google Forms:
  - Cabecera: imagen, título, descripción rich-text.
  - Lista de preguntas con drag&drop y los tipos de la imagen 4.
  - Sidebar de configuración: idiomas, fechas apertura/cierre, max respuestas, mensaje de confirmación, emails de aviso, pago manual, **modo externo** (toggle "Esta inscripción se hace en una página externa" → URL + comportamiento redirect/iframe).
- `/admin/registrations/$id/responses` → tabla con filtros (estado, pago, búsqueda), exportable a CSV, modal de detalle por respuesta con: respuestas completas, archivos descargables, toggle "Pago recibido" con nota, notas internas.

### Página pública
- Ruta única `/inscripcion/$slug` (+ `/ca/inscripcio/$slug`, `/en/registration/$slug`).
- Si `external_mode = redirect` → redirige al cargar.
- Si `external_mode = iframe` → embebe la URL.
- Si no, renderiza el formulario nativo con validación cliente+servidor (zod), respeta `max_responses` y ventana de fechas.
- Tras enviar muestra el `confirmation_message` y dispara email.

### Emails (Resend vía connector)
- Email al usuario: confirmación con resumen + mensaje configurable.
- Email a `notify_emails`: nueva inscripción con link al detalle en admin.
- Plantillas React Email simples reutilizando paleta de la web.
- Si Resend no está conectado todavía, el plan incluye el paso de conectarlo (`standard_connectors--connect resend`).

### Bloque "Formulario embebido" en CMS
Tipo de bloque `form_embed` que en cualquier página custom inserta un formulario por slug. Así una página CMS puede tener narrativa + formulario al final.

---

## 3. Blog enriquecido

Sustituimos los textareas planos por un editor rich-text **Tiptap** con extensiones:
- Cabecera, párrafos, H2/H3, listas, citas, separadores, links.
- **Imagen inline con pie de foto y alineación** (subida a bucket `media`).
- Embeds (YouTube, Instagram, X).
- Tabla simple.

Cambios en `blog_posts`:
- Mantener `content_es/ca/en` como TEXT pero pasar a guardar **HTML serializado** desde Tiptap (compatible con lo existente).
- Añadir `reading_time_minutes`, `tags` (text[]) opcional.

Pantalla `/admin/blog/new` y `/admin/blog/$id/edit` con:
- Imagen de cabecera (subida) + alt.
- Título, slug (auto desde título, editable), excerpt por idioma.
- Tabs ES/CA/EN con el editor Tiptap.
- Fecha de publicación, estado borrador/publicado.
- Botón "Copiar contenido desde ES".

El listado público y el render de `BlogPostPage` ya consumen HTML; sólo añadiremos estilos `prose` para imágenes con `<figure><figcaption>`.

---

## Detalles técnicos

- **Tiptap** (`@tiptap/react`, `starter-kit`, `image`, `link`, `placeholder`) compartido entre CMS, formularios (descripciones) y blog.
- **Drag & drop**: `@dnd-kit/core` + `@dnd-kit/sortable`.
- Toda la lógica de servidor en `createServerFn` con `requireSupabaseAuth` y check `has_role(_, 'super_admin')` para escritura.
- Lectura pública vía server fn que use `supabaseAdmin` (loaders SSR sin sesión).
- Migraciones SQL con `GRANT` + RLS + policies (admin para escribir, anon para leer sólo formularios `status='open'` y respuestas: sólo admin).
- Validación con `zod` tanto en cliente como en handler.
- Sanitización del HTML de Tiptap antes de renderizar (DOMPurify en server fn de save).

## Fases sugeridas

1. **Infraestructura común**: instalar Tiptap + dnd-kit, crear bucket `registration-uploads`, helpers de sanitización.
2. **CMS de bloques** (modelo, editor, renderer, integración con páginas custom existentes).
3. **Blog enriquecido** (Tiptap en `/admin/blog`).
4. **Inscripciones** (modelo, editor, página pública, panel respuestas).
5. **Resend + emails de inscripción**.
6. Pulido: exportar respuestas CSV, bloque `form_embed`, modo externo (redirect/iframe).

Cada fase es desplegable de forma independiente, así puedes ir validando sin esperar al final.

## Fuera de alcance (lo dejo como fase posterior si lo confirmas)

- Pagos online (Stripe) — has elegido marcado manual.
- Versionado/historial visual de bloques (la tabla `content_section_history` actual cubre lo esencial, pero el nuevo modelo de bloques arrancaría sin snapshots).
- Permisos granulares de editor (todo admin = super_admin por ahora).
