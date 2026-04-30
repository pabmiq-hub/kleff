## Diagnóstico

### 1. ¿Se usa Firecrawl en Meetup?
Sí — **pero como fallback, no como fuente principal**. En `src/server/meetup.functions.ts`:

- `fetchHtml()` primero intenta `fetch` directo con User-Agent de Chrome.
- Solo si la respuesta falla o es muy pequeña (<5000 bytes, señal de bloqueo), llama a `fetchHtmlFirecrawl()`.
- En la práctica, Meetup suele responder al fetch directo, así que Firecrawl casi nunca se invoca para Meetup. La caché en memoria (1 h) reduce aún más las llamadas.

**Conclusión**: el uso de Firecrawl en Meetup es residual. No hace falta tocarlo, salvo que quieras eliminar el fallback por completo (el riesgo es que si Meetup empieza a bloquear, los eventos dejen de cargar).

### 2. ¿Por qué tarda tanto /media?
Causa raíz en `src/server/media.functions.ts`:

- `getMediaItems()` se ejecuta en el **loader** de la ruta, así que la página **no renderiza hasta que termina**.
- Para cada enlace de prensa sin `imageOverride`, lanza una petición a Firecrawl en paralelo (`Promise.allSettled`).
- Firecrawl tarda **3–10 s por URL**, y al ir en paralelo el tiempo total = el más lento.
- La caché es **en memoria del Worker** (`Map`), por lo que cada cold start del Worker (despliegues, inactividad) pierde todo y vuelve a hacer 10+ scrapes.
- Lo mismo ocurre con `getInstagramFollowers()`.

Resultado: cada vez que el Worker se reinicia, la primera visita a `/media` espera bloqueada varios segundos mientras se vuelve a hacer scraping de toda la lista.

---

## Plan

### A) Persistir caché de Open Graph en la base de datos

Crear tabla `media_og_cache` (clave = URL) con: `og_title`, `og_description`, `og_image`, `og_site_name`, `fetched_at`, `error`. RLS: lectura pública, escritura sólo desde server (service role).

Reescribir `getMediaItems()` así:
1. Leer todas las filas de `media_og_cache` para las URLs de `PRESS_LINKS` con `supabaseAdmin` (rápido, una sola query).
2. Devolver inmediatamente al cliente lo que tengamos cacheado + los `imageOverride` manuales. **Nunca bloquear el render por scraping.**
3. Para URLs sin caché o con caché expirada (>30 días), disparar el scraping en background tras devolver la respuesta — usando `globalThis.waitUntil?.(...)` cuando esté disponible, con fallback a fire-and-forget. La siguiente visita ya verá los datos.

Esto convierte la primera visita en "instantánea" salvo para enlaces nuevos, y elimina las llamadas repetidas a Firecrawl.

### B) Endpoint admin para refrescar manualmente

Crear ruta `/api/public/refresh-media-og` (POST, protegida con un secreto `MEDIA_REFRESH_TOKEN` en header) que:
- Recorre `PRESS_LINKS`, hace el scrape vía Firecrawl y actualiza la tabla.
- Permite forzar un refresco puntual cuando se añadan enlaces nuevos, sin esperar a que un usuario lo dispare.

Opcionalmente, exponer un botón en `/admin` para llamarlo. (Si lo prefieres simple, omitimos el botón — basta con que se regenere bajo demanda al añadir entradas.)

### C) Cache de seguidores de Instagram

Mover `followersCache` también a la tabla (una fila singleton tipo `key='instagram_followers'`) o a una tabla pequeña `kv_cache(key, value, fetched_at)`. TTL persistente de 6 h. Igual que arriba: devolver el último valor conocido al instante y refrescar en background si está caduco.

### D) (Opcional) Reducir Firecrawl en Meetup

Mantener el fallback Firecrawl pero **condicionarlo a un flag** `MEETUP_ALLOW_FIRECRAWL` (por defecto `true`). Así puedes desactivarlo si quieres, sin tocar código.

---

## Detalles técnicos

**Migración SQL** (resumen):
```sql
create table public.media_og_cache (
  url text primary key,
  og_title text,
  og_description text,
  og_image text,
  og_site_name text,
  fetched_at timestamptz not null default now(),
  error text
);
alter table public.media_og_cache enable row level security;
create policy "media_og_cache public read"
  on public.media_og_cache for select using (true);
-- escritura solo via service role (sin policy para anon/authenticated)

create table public.kv_cache (
  key text primary key,
  value jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.kv_cache enable row level security;
create policy "kv_cache public read"
  on public.kv_cache for select using (true);
```

**Archivos a tocar**:
- `src/server/media.functions.ts` — leer de DB, devolver instantáneamente, refrescar en background.
- `src/routes/api.public.refresh-media-og.ts` — endpoint protegido para forzar refresco.
- `src/server/meetup.functions.ts` — añadir flag opcional para desactivar fallback Firecrawl.
- Migración para las dos tablas.

**Lo que NO cambia**:
- `PRESS_LINKS` sigue siendo la fuente de verdad de qué enlaces mostrar.
- La UI de `/media` no requiere cambios.
- Firecrawl sigue disponible como fallback de Meetup (recomendado mantenerlo).

---

## Resumen para el usuario

1. **Meetup**: Firecrawl sólo se usa como red de seguridad; el fetch directo casi siempre funciona. Lo dejamos.
2. **Media**: la lentitud viene de hacer 10+ scrapes con Firecrawl en cada cold start del servidor. Persistimos los resultados en la base de datos, devolvemos al instante lo cacheado y sólo scrapeamos URLs nuevas en background. La página debería pasar de varios segundos a carga instantánea.

¿Aprueba este plan?