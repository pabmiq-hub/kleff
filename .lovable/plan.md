## Diagnóstico real

He inspeccionado la página `/sobre-nosotros` en el preview y la red. Lo que está pasando:

**1. Sección "Equipo" sale en blanco (cards vacías)**
- Las 7 fotos del equipo apuntan a `https://kleff.es/wp-content/uploads/...` (WordPress antiguo).
- Las URLs responden 200, pero el navegador **no llega a pedirlas**: las imágenes están dentro de `.flip-card-face` con `transform-style: preserve-3d` + `backface-visibility: hidden` + `loading="lazy"`. Chromium no las considera visibles para el IntersectionObserver del lazy-load y nunca se disparan. Resultado: cards con solo el degradado de fondo y el emoji, sin foto. Esto es lo que ves como "roto".
- Además están duplicadas en `src/components/pages/AboutPage.tsx` y en `src/cms/schemas.ts` (los defaults del editor).

**2. Imágenes lentas en general**
- Las que cargan desde `kleff.es` tardan 600-1000 ms cada una porque el WordPress antiguo no tiene CDN ni caché. Hay que dejar de depender de él.
- Las imágenes subidas vía CMS (Supabase Storage) salen sin `width`/`height` ni `decoding="async"` → provocan *layout shift* (la página da saltos mientras carga, percepción de "no carga" o "se rompe").
- No hay `fetchpriority` en imágenes hero/LCP, así que compiten con scripts y tardan en aparecer.

---

## Plan de solución

### 1) Migrar las 7 fotos del equipo al CDN de Lovable
- Descargar las 7 imágenes desde `kleff.es/wp-content/uploads/...` a `/tmp`.
- Subirlas con `lovable-assets create` → generar `src/assets/team/{nombre}.jpg.asset.json` para cada una.
- Reemplazar las URLs hardcodeadas en `src/components/pages/AboutPage.tsx` y en los defaults de `src/cms/schemas.ts` por los pointers del CDN.
- Beneficio: servidas desde el CDN global de Lovable con caché agresiva (instantáneas) y estables aunque la web antigua caiga.

### 2) Arreglar el bug de carga de las flip-cards
- Quitar `loading="lazy"` de las fotos del equipo (son above-the-fold en móvil y el contenedor 3D rompe el lazy-load).
- Añadir `width="450"` y `height="600"` explícitos para reservar el espacio y evitar saltos.
- Añadir `decoding="async"` para no bloquear el render.

### 3) Optimizar imágenes del CMS / subidas por el usuario
- En `src/components/cms/BlockRenderer.tsx` (bloque `image`): añadir `width`/`height` desde los metadatos del bloque cuando existan, `decoding="async"` y `fetchpriority="auto"`. La primera imagen del post (LCP) marcarla con `fetchpriority="high"` y `loading="eager"`.
- En `src/cms/Editable.tsx` y en `src/components/site/InstagramEmbed.tsx`: añadir `decoding="async"` y dimensiones cuando estén disponibles.
- Verificar que `uploadMedia` devuelva la URL pública con caché (Supabase Storage ya añade `Cache-Control: max-age=3600` por defecto; no hace falta tocar el bucket).

### 4) Buscar y reportar otros hotlinks externos
- Auditar con `rg "src=\"https?://"` para detectar otras imágenes externas (prensa, colaboraciones) y, si pertenecen a `kleff.es` antiguo, migrarlas también al CDN.
- Las imágenes de prensa de medios reales (`elpais.com`, etc.) se quedan tal cual: no son nuestras.

### 5) Verificación
- Ejecutar `bun run build`.
- Abrir `/sobre-nosotros` en el preview, hacer screenshot full-page y confirmar que las 7 fotos del equipo se ven.
- Revisar la pestaña de red en el preview para confirmar que las imágenes ya se sirven desde `/__l5e/assets-v1/...` y no desde `kleff.es`.

---

## Detalles técnicos

- Las fotos del equipo se almacenan en `src/assets/team/` como `.asset.json` (formato pointer de Lovable Assets). El código las consume vía `import imgAsset from "@/assets/team/pau.jpg.asset.json"; <img src={imgAsset.url} />`.
- Las imágenes subidas por el usuario seguirán en el bucket `media` de Supabase Storage (el flujo actual de `uploadMedia` es correcto), simplemente se renderizan con dimensiones y atributos correctos para evitar CLS.
- No se toca el esquema de base de datos ni la lógica de upload — solo el render y los assets estáticos.

¿Procedo?