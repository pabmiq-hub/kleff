# Plan de implementación (en orden)

Voy a ejecutar los 4 bloques pendientes, uno tras otro, en este orden. Cada bloque se entregará por separado para que puedas probarlo antes de avanzar al siguiente.

## 1. Modo edición global (todas las páginas públicas)

- Botón "Modo edición" en el header, visible sólo para super admins, en todas las rutas públicas (Home, Sobre, Actividades, Ludoteca, Blog, Medios, Contacto, legales, páginas personalizadas). Oculto en `/admin`, `/app`, `/login`, `/auth`.
- Al activarlo: overlays sobre cada bloque editable (hero, secciones, tarjetas, textos enriquecidos, imágenes) con lápiz/ojo/eliminar.
- Estado del modo edición en `localStorage` + provider React, persistente entre navegaciones.
- Reutilizar `EditorOverlay` existente; añadir un `EditModeToggle` y un `EditModeProvider`.

## 2. CMS avanzado de páginas ("Contenido")

- Arreglar el error 500 actual al publicar páginas (revisar serverFn `publishContentPage`).
- Lista de páginas con acciones: ✏️ editar, 👁️ previsualizar (abre en nueva pestaña con `?preview=1`), 🗑️ eliminar (con confirmación).
- Editor de bloques con tipos: **Hero, Texto enriquecido, Imagen, Galería, Columnas, CTA, FAQ, Embed, Cards, Animaciones**.
- Drag & drop para reordenar bloques, multi-idioma (es/ca/en), borrador vs publicado.
- Render público en `/$slug` usando `content_pages` + `content_page_blocks`.

## 3. Inscripciones v2

- Al crear: diálogo "¿formulario propio o enlace externo (embed)?".
- Multi-idioma: `title_es/ca/en`, `description_es/ca/en`, preguntas traducibles.
- Subida de imagen de cabecera desde el dispositivo (bucket `media`).
- Slug raíz: las URLs públicas pasan de `/inscripciones/<slug>` a `/<slug>` (ruta dinámica `$slug` con prioridad después de rutas estáticas). Redirect 301 desde `/inscripciones/<slug>` para no romper enlaces.
- Validación de colisión de slugs contra rutas reservadas (`admin`, `app`, `blog`, etc.).

## 4. Lovable Mail con `hola@kleff.es`

Como `kleff.es` ya está en Google Workspace, no podemos delegar el dominio raíz a Lovable sin romper tu correo. Propongo:

- Delegar subdominio técnico `notify.kleff.es` (registros NS → `ns3.lovable.cloud` / `ns4.lovable.cloud`).
- Lovable gestiona SPF/DKIM/DMARC ahí.
- Remitente visible: **`hola@kleff.es`** (gracias a `display_from_root`), envío real desde `notify.kleff.es`. Las respuestas llegan a tu buzón de Google como hasta ahora.
- Tras verificar dominio: scaffolding de **auth emails** (recuperación contraseña, verificación, invitaciones) y **app emails** (confirmación contacto, confirmación de inscripción).

## Notas técnicas

- Stack: TanStack Start + Lovable Cloud (Supabase). Server functions con `requireSupabaseAuth`.
- No tocaré `/admin`, `/app`, `/login` con overlays ni con el shift de layout.
- Cada bloque incluye migración SQL si requiere cambios de esquema (CMS y Inscripciones sí; Modo edición no).

¿Empiezo con el **bloque 1 (Modo edición global)**?
