# Enlaces públicos de eventos + slug personalizable

Hoy los QR y enlaces (registro, check-in, panel de usuario) apuntan a `kleff.es/event/<id>/join`, pero esas páginas todavía no existen en KLEFF: por eso sale 404. Faltan las pantallas públicas del participante y la lógica de servidor que las alimenta.

## Qué se va a construir

### 1. Slug de evento
- Cada evento tendrá un identificador legible (`sfl-amistades-sept`), único, editable.
- Se propone automáticamente a partir del nombre al crear el evento y se puede cambiar en cualquier momento desde la ficha del evento (con aviso de que los enlaces antiguos siguen funcionando).
- Los eventos ya existentes reciben un slug generado a partir de su nombre.

### 2. URLs públicas nuevas
```text
kleff.es/sfl-amistades-sept/registro     -> inscripción
kleff.es/sfl-amistades-sept/check-in     -> check-in con código
kleff.es/sfl-amistades-sept/usuario      -> panel del participante
kleff.es/sfl-amistades-sept/mesas        -> mesas y rondas
kleff.es/sfl-amistades-sept/seleccion    -> selección de matches
kleff.es/sfl-amistades-sept/cancelar/... -> cancelar inscripción
```
Las URLs antiguas (`/event/<id>/join`, `/checkin`, `/select`, `/tables`, `/access`) se mantienen y redirigen a las nuevas, para que ningún QR ya impreso o email enviado se rompa.

### 3. Pantallas del participante
Se portan tal cual desde Match Maker Pro (mismo diseño, mismos botones y funcionalidad; solo cambian paleta y tipografía a las de KLEFF): inscripción, check-in, panel de acceso, mesas, selección, cancelación, respuesta a crush/repeat y páginas de serie de eventos.

### 4. Lógica de servidor
Las pantallas dependen de ~20 procesos de backend del proyecto original (registro con lista de espera, envío de códigos por email, check-in, asignación de mesas, envío y actualización de selecciones, crush/repeat, elegibilidad wrapped). Se reimplementan dentro de KLEFF como funciones de servidor, reutilizando el envío de correo ya existente en KLEFF.

### 5. QR y enlaces del panel
Todos los generadores de QR, botones "copiar enlace" y emails pasan a usar la URL con slug.

## Detalle técnico
- Migración: `kon_events.slug text unique` + backfill con slugificación del nombre y desambiguación numérica; índice único.
- Rutas TanStack: `src/routes/$eventSlug.registro.tsx`, `.check-in.tsx`, `.usuario.tsx`, `.mesas.tsx`, `.seleccion.tsx`, `.cancelar.$participantId.tsx`, más `event.$id.*.tsx` como redirecciones 301 al slug. El resolutor de slug es una server function que devuelve `notFound()` si no existe, para no colisionar con las páginas estáticas de KLEFF.
- Páginas portadas a `src/konektum/pages/participant/*` con `@ts-nocheck` y el codemod de imports ya usado (`@/konektum/router`, `@/konektum/ui/*`, `@/konektum/supabase`).
- Edge functions → `createServerFn` en `src/lib/konektum-participant.functions.ts` + `*.server.ts`, con `supabaseAdmin` dentro del handler; el shim `supabase.functions.invoke` se redirige a esas funciones para no reescribir las llamadas de las páginas.

## Orden de entrega
1. Slug en base de datos + edición en el panel + generadores de QR/enlaces actualizados.
2. Inscripción y check-in (el flujo crítico) con su backend.
3. Panel de usuario, mesas y selección con su backend.
4. Crush/repeat, cancelación y series.
