# Optimización de créditos Firecrawl

## Decisiones confirmadas
1. Quitar el contador de seguidores de Instagram en `/medios` (y locales `/ca/mitjans`, `/en/media`).
2. Meetup: mantener 3 eventos + miembros/rating reales. Direct fetch siempre primero; Firecrawl sólo como fallback y, como máximo, **una vez cada 10 días**.
3. BGG: toda la información debe quedar persistida en `bgg_games` desde la API de Ludoya. Firecrawl no debería entrar en el flujo normal.

---

## 1. Instagram — eliminar Firecrawl
- Borrar de `src/lib/media.functions.ts`: `scrapeFollowers`, `loadFollowersCache`, `saveFollowersCache`, `scheduleFollowersRefresh`, `getInstagramFollowers`, constantes `FOLLOWERS_*`.
- Quitar `getInstagramFollowers` del loader y de la prop en `src/routes/medios.tsx`, `src/routes/ca.mitjans.tsx`, `src/routes/en.media.tsx`.
- En `src/components/pages/MediaPage.tsx`: quitar la prop `followers` y el badge/contador asociado.
- Ahorro: ~4 créditos/día constantes.

## 2. Meetup — Firecrawl como plan B, cada 10 días
En `src/lib/meetup.functions.ts`:
- Persistir el resultado completo (`events`, `stats`, `google`) en la tabla existente `kv_cache` con key `meetup_data` y `fetched_at`.
- Lógica del handler `getMeetupEvents`:
  1. Leer `kv_cache`. Si edad < **1 h** → devolver directo.
  2. Si edad ≥ 1 h → intentar **direct fetch** (Meetup events + group home + Google search, como ahora). Si funciona → refrescar cache y devolver. **0 créditos.**
  3. Si direct fetch devuelve HTML demasiado corto o falla en los 3 → comprobar marca `firecrawl_last_at` (también en `kv_cache`, key `meetup_firecrawl_lock`). Si han pasado < **10 días**, devolver la cache vieja (aunque sea stale) con `error: "stale"`. **0 créditos.**
  4. Sólo si han pasado ≥ 10 días desde el último intento Firecrawl → llamar a Firecrawl (las URLs que hagan falta), guardar resultado y actualizar `firecrawl_last_at`.
- Resultado: en marcha normal, 0 créditos. Si Meetup bloquea, máximo 1 ráfaga cada 10 días.

## 3. BGG — confiar en Ludoya, quitar Firecrawl del flujo
La API de Ludoya (`api.ludoya.com/users/kleff/boardgames` y `/boardgames/{slug}`) **no devuelve mecánicas, categorías ni tipo**: sólo nombre, jugadores, duración, edad, rating y complejidad. Por eso hoy se enriquece adicionalmente desde `api.geekdo.com` (con Firecrawl como fallback cuando BGG bloquea). Para cumplir tu objetivo de no depender de Firecrawl:

En `src/lib/bgg.server.ts`:
- **Eliminar el fallback Firecrawl** dentro de `fetchGeekdoItem`. Si BGG bloquea → devolver `null` y seguir sin enriquecer (los campos viejos en DB se preservan; no se sobreescriben a vacío).
- En `buildRecord`, si `extra` es `undefined` y ya existe el juego con `categories`/`mechanics`/`bgg_type` poblados, **conservar los valores antiguos** (merge en vez de reemplazar). Así, una vez enriquecido un juego, queda en la plataforma para siempre.
- Añadir **skip de enriquecimiento** cuando el juego ya tiene `bgg_type` y `mechanics.length > 0` y `last_synced_at < 30 días`. Reduce llamadas a `api.geekdo.com` y evita 429.
- Mantener el cron diario para detectar altas/bajas (eso es Ludoya, gratis).

Si en el futuro quieres mecánicas/categorías garantizadas sin BGG, habría que cambiar la fuente (p. ej. una API de pago tipo BoardGameAtlas) — eso queda fuera de este plan; lo aviso para que lo tengas en cuenta.

---

## Archivos modificados
- `src/lib/media.functions.ts`
- `src/lib/meetup.functions.ts`
- `src/lib/bgg.server.ts`
- `src/routes/medios.tsx`, `src/routes/ca.mitjans.tsx`, `src/routes/en.media.tsx`
- `src/components/pages/MediaPage.tsx`

Sin migraciones (uso `kv_cache` y `bgg_games` ya existentes). Sin tocar crons.

## Resultado esperado
- Uso diario de Firecrawl: **0 créditos** en operación normal.
- Picos sólo si Meetup bloquea direct fetch → como mucho cada 10 días.
- BGG nunca usa Firecrawl; los datos ya enriquecidos quedan persistidos.
