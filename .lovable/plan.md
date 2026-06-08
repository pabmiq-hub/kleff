# Optimización global de imágenes

## Diagnóstico

He auditado todas las imágenes de la plataforma (no sólo el blog). Hay **5 causas reales** que se suman:

### 1. `/ludoteca` carga 642 imágenes en tamaño completo desde BoardGameGeek (el peor de todos)
La página de la ludoteca renderiza **642 juegos**, y en cada tarjeta usa:

```tsx
src={g.image_url ?? g.thumbnail_url}
```

`image_url` apunta a `cf.geekdo-images.com` con la **box-art original**, que típicamente pesa **500 KB – 2 MB** por imagen. Mostrar el catálogo entero puede llegar a **>500 MB de imágenes solicitadas** al navegador. Lazy-loading ayuda al scroll, pero las primeras decenas siguen tardando muchísimo, y al filtrar/scrollear se nota brutal.

Lo correcto en una grid pequeña (aspect-square) es **usar `thumbnail_url` primero** (~10–30 KB) y reservar `image_url` para vistas detalle.

### 2. Portadas del blog servidas desde WordPress (kleff.es / Hostinger)
Los 37 posts importados guardan `cover_image_url` apuntando a `https://kleff.es/wp-content/uploads/...`. Origen lento, sin CDN, sin redimensionar (1-3 MB cada uno). Impacta `/blog`, `/en/blog`, `/ca/blog` y cada post.

### 3. Logo de Blood on the Clocktower de **1.3 MB** en el bundle
`src/assets/clocktower-logo.png` pesa 1.27 MB sin razón. Importado en `ClocktowerPage`, además infla el chunk JS.

### 4. Imágenes pesadas sin formato moderno (WebP/AVIF) ni variantes responsive
- `public/media/*.jpg`: media-analogicos-2025 (244 KB), media-regio7-2025 (151 KB), etc.
- `src/assets/hero-*.jpg`: 100-155 KB cada uno.
- CMS uploads en bucket `media`: varias de 300-614 KB sin comprimir.

Se sirven a tamaño completo en cualquier viewport, sin WebP.

### 5. Falta de hints de red y atributos básicos en `<img>`
- No hay `<link rel="preconnect">` a `cf.geekdo-images.com` ni al storage de Lovable Cloud → handshake TLS por cada imagen.
- La mayoría de `<img>` no llevan `width`/`height` → causa Cumulative Layout Shift y bloquea decodificación eficiente.
- Faltan `decoding="async"` y `fetchpriority` en LCPs.

## Plan de optimización

### Paso 1 — Arreglar el catálogo de ludoteca *(impacto máximo, cambio trivial)*
En `LudotecaPage.tsx`, invertir prioridad en la grid:
```tsx
src={g.thumbnail_url ?? g.image_url}
```
Añadir `width`, `height`, `decoding="async"`. Esto pasa de cientos de MB a unos pocos MB en `/ludoteca`. La página detalle de un juego (si existiera) sigue pudiendo usar `image_url`.

### Paso 2 — Rehospedar portadas del blog en nuestro storage
Crear server function `adminMirrorBlogImages` que:
- recorra los 37 posts,
- descargue cada `cover_image_url` de kleff.es,
- la suba al bucket público `media` reutilizando `uploadMedia`,
- actualice `blog_posts.cover_image_url` con la nueva URL,
- también rescribe `<img src="https://kleff.es/...">` dentro del `content_md`/HTML del post.

Botón **"Rehospedar imágenes"** en `/admin/blog` (sin coste IA, sólo I/O).

### Paso 3 — Comprimir y migrar assets pesados al CDN de Lovable Assets
- Reemplazar `clocktower-logo.png` (1.3 MB) por versión optimizada (~80 KB).
- Convertir a WebP (calidad 80) los heroes locales y `public/media/*.jpg` >100 KB.
- Subir los assets >100 KB al CDN con `lovable-assets create` para sacarlos del bundle.

### Paso 4 — Atributos de imagen + preload del LCP
- Añadir `width`/`height` y `decoding="async"` a todos los `<img>` (especialmente en grids: ludoteca, blog list, members, rentals).
- En `BlogPostPage` (LCP es la portada): `fetchpriority="high"` + `<link rel="preload" as="image">` en `head().links` del route.
- Mantener `loading="eager"` sólo en LCP por página; el resto `lazy`.

### Paso 5 — Preconnect en `__root.tsx`
Añadir hints de conexión temprana:
```tsx
{ rel: "preconnect", href: "https://cf.geekdo-images.com", crossOrigin: "anonymous" },
{ rel: "preconnect", href: "https://gyecpblbaovmprdvgmct.supabase.co" },
```
Reduce ~100–300 ms de TLS en la primera imagen de cada host.

### Paso 6 *(opcional, segunda fase)* — Optimizar uploads del CMS
Cuando alguien sube imagen vía editor en bucket `media`, comprimir en `uploadMedia` (max 1600 px de ancho, WebP calidad 82). Hoy se guardan tal cual (hasta 614 KB).

## Orden recomendado

| # | Tarea | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | Ludoteca: usar `thumbnail_url` | 🔥🔥🔥 | 1 línea |
| 2 | Rehospedar imágenes blog | 🔥🔥 | medio |
| 3 | Comprimir clocktower-logo + heros a WebP + assets al CDN | 🔥🔥 | medio |
| 4 | Atributos `width/height/decoding` + preload LCP | 🔥 | bajo |
| 5 | Preconnect en `__root` | 🔥 | trivial |
| 6 | Optimización en subida CMS | 🔥 | medio |

## Pregunta

¿Aplico los **5 primeros pasos** en este turno (es lo que se nota de inmediato) y dejamos el Paso 6 como mejora posterior? ¿O prefieres empezar sólo por el Paso 1 (el cambio de 1 línea en ludoteca, que es donde más se nota)?
