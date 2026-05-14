
# Alquiler de juegos + mejoras Ludoteca

## 1. Modelo de datos (migraciones)

### 1.1 Ampliar `bgg_games` (campos editables manualmente, no se sobrescriben en sync BGG)
- `total_copies` (ya existe) — editable
- `max_rental_days` (ya existe) — editable
- `shelf` enum: `'1' | '2' | '3' | '4' | 'on_demand' | 'drawer'`
- `shape` enum: `'triangle' | 'heart' | 'square'` (sólo si shelf 1-4)
- `slot_number` smallint 1-5 (sólo si shelf 1-4)
- `drawer_number` smallint 1-4 (sólo si shelf = drawer)
- `drawer_letter` char 'a'|'b'|'c'|'d' (sólo si shelf = drawer)
- `notes_admin` text

→ El sync BGG hará `UPDATE` sólo de columnas BGG, nunca de estos campos manuales.

### 1.2 Nueva `rental_settings` (singleton, super_admin only)
- `game_night_weekday` smallint (0-6, domingo=0). Default = miércoles.
- `cooldown_weeks` smallint default 4
- `monthly_quota` smallint default 2
- `block_if_overdue` boolean default true

### 1.3 `rental_requests` (refinar)
- añadir `pickup_date` date, `return_date` date (calculadas: próxima/siguiente noche de juego)
- añadir `status` extra: `waitlisted`
- añadir `position` smallint (orden en cola por juego+fecha)

### 1.4 `rentals` (existente) — sin cambios estructurales mayores

### 1.5 RLS
- `bgg_games`: ya OK
- `rental_settings`: select público (anon), update/insert solo super_admin
- `rental_requests`: socio ve/crea las suyas, admin ve todas

## 2. Lógica de noche de juego

Helper compartido (`src/lib/gameNights.ts`):
- `nextGameNight(from: Date, weekday: number): Date`
- `gameNightAfter(date: Date, weekday: number): Date`

Default: recoger = próxima noche desde hoy; devolver = la siguiente (7 días). Visible al socio antes de confirmar.

## 3. Reglas anti-abuso (validadas en server fn `requestRental`)

Bloquea si:
1. Tiene rental activo no devuelto **y** está vencido (`now > due_at`).
2. Ya tiene 2 alquileres (request `pending|approved` + rental `active`) en el mes en curso.
3. Mismo `game_id` alquilado/solicitado en las últimas 4 semanas.
4. Sin copia libre **y** ya hay N personas en lista de espera para esa misma fecha → opcional permitir.

Mensajes claros con motivo del bloqueo.

## 4. Flujo de reserva (socio)

`/app/rentals` (existe, ampliar):
- Buscador del catálogo (reusa data de ludoteca).
- Selector "fecha de recogida" = próximas 4 noches de juego.
- Si copia libre → crea `rental_request` `pending` (admin aprueba).
- Si sin copia → propone "Apuntarme a lista de espera" → `waitlisted` + posición.
- Tras aprobación admin: aparece en `/app/rentals/mine` con QR/recordatorio de fecha.

## 5. Panel super-admin

### 5.1 `/admin/rentals/catalog` (mejorar el actual)
- Edición inline de `total_copies` (input numérico).
- Nueva sección "Ubicación" con selectores condicionales (shelf → shape+slot ó drawer+letter), o "—" si on_demand/drawer.
- Filtros: por estantería, sin ubicar, inactivos.
- Búsqueda.

### 5.2 `/admin/rentals/index` (solicitudes)
- Cola de pending agrupada por fecha de noche de juego.
- Aprobar / rechazar / pasar a lista de espera con un click.
- Ver disponibilidad: `total_copies − rentals_activos − pending_aprobados_para_esa_fecha`.

### 5.3 `/admin/rentals/active` y `history` (existentes) — añadir vencidos destacados.

### 5.4 Nueva `/admin/rentals/settings`
- Editar día de noche de juego, cooldown, cuota mensual, bloqueo por retraso.

## 6. Ludoteca pública — mejoras

### 6.1 Badge de ubicación
En cada card del juego un chip pequeño, siempre visible:
- Estantería 1-4: `🔺 E2·3` (icono forma + nº estantería + nº slot). Color por estantería.
- Cajón: `🗄 C2·a`
- Bajo pedido: `📦 Bajo pedido`
- Tooltip al hover: "Estantería 2 · forma triángulo · posición 3".

Leyenda fija al final de la página explicando el sistema (1-2 líneas + iconos).

### 6.2 Disponibilidad
- `Disponibles: 2/3` con punto verde/ámbar/rojo.

### 6.3 Recomendaciones
Nueva sección "¿Te gustó X? Prueba…":
- Selector con autocomplete del catálogo.
- Algoritmo similitud (server fn, sin IA):
  - Score = α·jaccard(mechanics) + β·jaccard(categories) + γ·(1 − |Δweight|/5) + δ·(1 − |Δduration|/120)
  - Excluye el propio juego e inactivos. Top 6.
- Cards con motivo: "Comparte: Worker Placement, Economic".

## 7. Página dedicada socio

- En `/app/rentals` añadir "Mis alquileres" (activos + historial), recordatorios de devolución, posición en lista de espera.

## 8. Cron / recordatorios (opcional fase 2)

`pg_cron` diario llama `/api/public/hooks/rental-reminders` para marcar overdue y (futuro) enviar email.

## Detalles técnicos

- Server fns nuevos en `src/server/rental.functions.ts`: `requestRental`, `cancelMyRequest`, `listMyRentals`, `joinWaitlist`, `adminApproveRequest`, `adminRejectRequest`, `adminUpdateLocation`, `adminUpdateCopies`, `adminUpdateSettings`, `getRentalSettings`, `recommendSimilar`.
- Validación zod estricta (shelf+shape+slot coherentes; drawer+letter+number).
- Reusar `listLudoteca` existente; ampliar SELECT con campos de ubicación y copias libres (subquery).
- UI: nuevos componentes `LocationBadge`, `LocationPicker`, `RentalRequestForm`, `RecommendationsSection`, `GameNightPicker`.
- Estilo: tokens existentes (`coral`, `cream`, `ink`). Iconos `lucide-react` (Triangle, Heart, Square, Archive, Package) + colores por estantería en `styles.css`.

## Orden de entrega sugerido

1. Migraciones + tipos
2. Editor de ubicación + copias en `/admin/rentals/catalog`
3. Badge de ubicación en ludoteca pública + leyenda
4. `rental_settings` + helper noches de juego + form admin
5. Flujo de reserva socio (sin lista de espera)
6. Aprobación admin con disponibilidad por fecha
7. Lista de espera + reserva por fecha futura
8. Recomendaciones por similitud
9. Cron de recordatorios (opcional)

¿Te encaja así? Si quieres ajusto cualquier punto antes de implementar.
