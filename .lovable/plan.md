# Separar paneles: Super Admin vs Socio

Hoy todo cuelga de `/app`, comparte el mismo layout ("KLEFF socios") y el admin solo añade unas tabs. Vamos a partirlo claramente en dos áreas con rutas, layouts, y navegación independientes.

## Estructura de rutas

```text
/app/*          → Zona privada del SOCIO (layout cream "KLEFF socios")
/admin/*        → Panel SUPER ADMIN (layout oscuro/diferenciado)
/super-admin    → Login dedicado (ya existe) → redirige a /admin
/login          → Login socio → redirige a /app
```

## Panel SOCIO (`/app/*`)

Sidebar y contenido enfocados solo en lo suyo. Si por casualidad un super admin entra a `/app`, ve un banner discreto con enlace "Ir al panel admin" pero NO ve secciones de admin mezcladas.

Secciones:
- **Inicio** (`/app`) — saludo, carnet resumido, accesos rápidos a "Mis alquileres" y "Catálogo"
- **Mi perfil** (`/app/profile`) — editar datos personales, avatar, DNI (ya existe)
- **Mi carnet** (`/app/carnet`) — carnet digital de socio (placeholder por ahora)
- **Alquilar juegos** (`/app/rentals`) — catálogo de juegos disponibles + botón "Solicitar alquiler"
- **Mis alquileres** (`/app/rentals/mine`) — activos + histórico, estado de cada solicitud

Quitamos del sidebar de `/app` el enlace "Admin". El acceso al panel admin será SOLO vía `/super-admin` o un menú de cuenta discreto.

## Panel SUPER ADMIN (`/admin/*`)

Layout NUEVO, visualmente diferenciado (fondo `ink` oscuro, badge "Admin" en cabecera, tipografía igual pero acento coral). Header dice "KLEFF · Administración", no "socios". Sidebar propia.

Secciones:
- **Resumen** (`/admin`) — KPIs: nº socios, invitaciones pendientes, alquileres activos, solicitudes pendientes
- **Socios** (`/admin/members`) — listado/fichas con toggle vista lista ↔ tarjetas. Columnas: nº socio, foto, nombre, @username, email, fecha de alta, género, fecha nacimiento, acción "Ver DNI", rol. Búsqueda + filtros. Detalle por socio en `/admin/members/$id`
- **Invitaciones** (`/admin/invitations`) — lo que ya existe, movido aquí
- **Alquileres** (`/admin/rentals`) — tabs:
  - *Solicitudes* (pendientes de aprobar/rechazar)
  - *Activos* (juego + socio + fecha inicio + fecha fin prevista + acción "Marcar devuelto")
  - *Catálogo* (juegos habilitados para alquiler, alta/baja, foto, descripción, días máx)
  - *Histórico*
- **Contenido / CMS** (`/admin/content`) — placeholder por ahora, lo construiremos después según el plan de bloques ya acordado. Submenú: Páginas, Blog, Media
- **Ajustes** (`/admin/settings`) — más adelante (dominio email, branding, etc.)

## Número de socio

Añadiremos a `profiles` un campo `member_number` (entero autoincremental, formato visible `K-0001`). Migración: secuencia + columna + backfill para los socios existentes por orden de `created_at`. Visible en su carnet y en la ficha del admin.

## Detalles técnicos

- Nuevos archivos:
  - `src/routes/admin.tsx` (layout admin con guard `isSuperAdmin`)
  - `src/routes/admin.index.tsx` (resumen/KPIs)
  - `src/routes/admin.members.tsx` (listado)
  - `src/routes/admin.members.$id.tsx` (detalle)
  - `src/routes/admin.invitations.tsx` (mover el actual)
  - `src/routes/admin.rentals.tsx` (layout con tabs)
  - `src/routes/admin.rentals.index.tsx`, `.requests.tsx`, `.active.tsx`, `.catalog.tsx`, `.history.tsx`
  - `src/routes/admin.content.tsx` (placeholder con submenú)
  - `src/routes/app.rentals.mine.tsx`
- Eliminar/redirigir las rutas viejas `/app/admin/*` → `/admin/*` (con `redirect()` en `beforeLoad`)
- `src/routes/app.tsx`: quitar el `NavLink` de Admin del sidebar, añadir banner sutil "Eres super admin → ir al panel" si procede
- `src/routes/super-admin.tsx`: cambiar destino post-login de `/app/admin` a `/admin`
- Migración SQL:
  - secuencia `member_number_seq`
  - columna `profiles.member_number int unique not null default nextval(...)`
  - backfill ordenado por `created_at`
  - tablas nuevas para alquiler: `rental_games`, `rental_requests`, `rentals` (con estados) — solo esquema básico en esta iteración, las pantallas listarán datos reales
- Server functions nuevas en `src/server/admin.functions.ts` para listar socios con `member_number`, contar KPIs, gestionar solicitudes/alquileres

## Orden de entrega

1. Crear estructura `/admin/*` + layout diferenciado + mover Invitaciones y Usuarios (renombrado a "Socios") con `member_number`
2. Limpiar `/app/*` (sidebar sin Admin, redirecciones desde rutas viejas, banner discreto para admins)
3. Esquema de alquiler en DB + pantallas admin (Solicitudes/Activos/Catálogo/Histórico) con datos reales
4. Pantalla socio "Alquilar" + "Mis alquileres" funcionales contra el mismo esquema
5. Placeholder `/admin/content` (el CMS de bloques se implementa después como ya planeamos)

## Lo que NO hago en este plan (lo dejamos para después)
- CMS de bloques completo (ya tenemos plan separado aprobado)
- Importador WordPress.com
- Emails de invitación / reset password (a la espera del dominio)
- Carnet digital visual (sigue como placeholder, solo con número de socio visible)

¿Apruebas el plan o quieres que ajuste algo (p. ej. mantener `/app/admin` en vez de `/admin`, o cambiar el alcance del paso 1)?
