# Panel "Medios" en admin + eliminar Firecrawl de prensa

## Objetivo
Crear una sección **Medios** en el panel de super admin desde donde se gestionan a mano las apariciones en prensa (alta, edición, borrado, previsualización). La página pública `/medios` pasa a leer de esa tabla, eliminando el scraping con Firecrawl para las publicaciones. Los datos actuales (de `PRESS_LINKS` + caché OG en `media_og_cache`) se migran a la nueva tabla para no perder nada y poder editarlos después.

## Qué se mantiene igual
- Diseño de la página pública `/medios` (`MediaPage`): hero, acordeones por año desc, tarjetas con fecha, medio, título, resumen, imagen y "Ver publicación".
- Funcionamiento de Instagram (feed Behold + contador de seguidores). Esto **no** se toca todavía — sigue usando Firecrawl solo para el contador de seguidores. Si más adelante quieres, lo eliminamos también.

## Cambios

### 1. Nueva tabla `media_appearances`
Campos:
- `id` (uuid)
- `url` (texto, único) — enlace al artículo
- `outlet` (texto) — p. ej. "EL PERIÓDICO · Qué hacer"
- `title` (texto) — titular que se muestra
- `description` (texto) — resumen 3-4 líneas
- `image_url` (texto) — imagen de cabecera (URL del bucket `media` ya existente o URL externa)
- `date_label` (texto) — etiqueta visible ("MAY 2026")
- `year` (int) y `month` (int 1-12) — para ordenar y agrupar por año
- `display_order` (int, default 0) — desempate dentro del mismo mes
- `is_published` (bool, default true) — para ocultar sin borrar
- `created_at`, `updated_at`

RLS: lectura pública sólo de filas `is_published = true`; escritura sólo super_admin (vía `has_role`). GRANTs estándar.

### 2. Migración de datos existentes
Script de migración que, por cada entrada de `src/data/press.ts`, inserta una fila combinando:
- `outlet`, `date_label` (date), `year`, `month`, `url` del array
- `title` = `titleOverride` ?? `og_title` (de `media_og_cache`) ?? `outlet`
- `description` = `descriptionOverride` ?? `og_description`
- `image_url` = `imageOverride` ?? `og_image`

Así arrancas con TODAS las publicaciones actuales ya cargadas y editables.

### 3. Server functions nuevas (`src/lib/media-appearances.functions.ts`)
- `listMediaAppearances({ includeDrafts })` — pública por defecto; admin pide drafts también.
- `createMediaAppearance(data)` — super admin.
- `updateMediaAppearance({ id, ...data })` — super admin.
- `deleteMediaAppearance({ id })` — super admin.
- `uploadMediaAppearanceImage(file)` — sube al bucket `media` existente y devuelve URL pública.

Las tres mutaciones usan `requireSupabaseAuth` + `assertSuperAdmin`. Validación con Zod (URL válida, year 2000-2100, month 1-12, longitudes máximas).

### 4. Página pública `/medios`, `/ca/mitjans`, `/en/media`
- El loader pasa de `getMediaItems()` (que usa Firecrawl) a `listMediaAppearances()`.
- `MediaPage` se adapta al nuevo tipo (campos directos, sin lógica `imageOverride ?? ogImage`).
- Se mantiene el acordeón por año y orden cronológico desc.

### 5. Nueva sección admin `/admin/media`
- Enlace "Medios" en la sidebar (`src/routes/admin.tsx`) con icono Newspaper.
- Ruta `admin.media.tsx`: tabla con todas las apariciones (orden por year/month desc), botón "Nueva publicación", buscador por outlet/título, badge de borrador.
- Ruta `admin.media.$id.tsx` (y `admin.media.new.tsx`): formulario con campos:
  - Mes (1-12) + Año (number) → genera automáticamente `date_label` "MAY 2026" según locale (editable).
  - Medio (input)
  - Título (input)
  - Descripción (textarea, 3-4 líneas, contador de caracteres)
  - Enlace URL (input)
  - Imagen: dos modos — pegar URL externa **o** subir archivo (reutiliza bucket `media` y `uploadMediaAppearanceImage`). Preview en vivo.
  - Toggle "Publicado".
- Botón **"Previsualizar"** que muestra una `MediaCard` real (mismo componente que en la web pública) con los datos del formulario, en un panel lateral o modal — exactamente como se verá en `/medios`.
- Guardar / Cancelar / Borrar (con confirmación).

### 6. Eliminar uso de Firecrawl en prensa
- `getMediaItems` y todo el flujo de `media_og_cache`/`scheduleBackgroundRefresh` se dejan de llamar desde la web y se eliminan del código (función + import en `media.functions.ts`, y la ruta `api.public.refresh-media-og.ts`).
- La tabla `media_og_cache` se conserva en BD por seguridad, pero deja de leerse/escribirse. (Si confirmas, en una segunda migración la borramos.)
- `src/data/press.ts` queda obsoleto — se elimina tras verificar la migración.
- `FIRECRAWL_API_KEY` sigue existiendo porque la usa todavía Instagram followers (y otras como BGG fallback / Meetup). No la borramos.

## Detalles técnicos

### Tabla SQL (resumen)
```sql
CREATE TABLE public.media_appearances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  outlet text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  date_label text,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  display_order int NOT NULL DEFAULT 0,
  is_published bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- GRANTs + RLS:
-- anon/authenticated: SELECT donde is_published = true
-- super_admin: ALL
```

### Orden en la web
`ORDER BY year DESC, month DESC, display_order DESC, created_at DESC`.

### Locale del `date_label`
Por defecto se genera en castellano ("MAY 2026"). El admin puede sobreescribirlo manualmente si quiere otra forma. La web pública lo muestra tal cual está guardado (igual que ahora con `date`).

### Imágenes
- Se reutiliza el bucket público `media` ya creado para que las imágenes sean rápidas y propias (no dependientes de terceros).
- Si el admin pega una URL externa, se acepta tal cual (mostraremos aviso de que puede dejar de funcionar).

## Resultado
- 0 llamadas a Firecrawl al cargar `/medios`.
- Carga de la página instantánea (un único SELECT a Postgres).
- Control total desde admin con previsualización fiel.
- Cero pérdida de información: todas las publicaciones actuales aparecen ya cargadas y editables.
