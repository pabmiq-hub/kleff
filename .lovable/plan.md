# Integración de Match Maker Pro en KLEFF

## Resumen

Integrar completamente Match Maker Pro (speed dating / matchmaking de eventos) dentro de kleff.es: su base de datos se fusiona con la de KLEFF, sus 38 edge functions se reescriben como server functions de TanStack Start, y sus 23 páginas se portan a rutas de la app actual. El super admin de KLEFF pasa a ser el administrador de Match Maker Pro.

## Datos clave del análisis

- **BD actual KLEFF: 1,22 GB** (disco al 52%, memoria 58%, conexiones bajas). Hay capacidad de sobra; no hace falta ampliar recursos.
- **Match Maker Pro**: ~30 tablas, ~50 migraciones, 38 edge functions (~10.700 líneas), 23 páginas (~17.000 líneas), React Router + SPA (stack distinto al de KLEFF).
- **Conflictos detectados**: ambos proyectos tienen tabla `user_roles` y enum de roles propio; MMP usa Stripe en el panel de super admin (planes/suscripciones); participantes acceden sin cuenta (flujo por códigos/email), solo hay 2 usuarios reales (super admin + 1 admin de evento).

## Estimación de créditos

No se puede conocer el coste exacto por adelantado, pero una estimación honesta por bloques:

| Bloque | Estimación orientativa |
|---|---|
| 1. Esquema + migración de datos | 10–20 créditos |
| 2. Backend (38 funciones → server functions) | 30–45 créditos |
| 3. Frontend (23 páginas → rutas TanStack) | 30–45 créditos |
| 4. Emails, ajustes y pruebas end-to-end | 10–15 créditos |
| **Total** | **~80–120 créditos**, repartidos en varias sesiones |

El coste real depende de las iteraciones de ajuste. Se puede pausar entre bloques y cada bloque queda funcional por sí mismo.

## Plan de ejecución

### Bloque 1 — Esquema y datos
- Crear las ~30 tablas de MMP en la BD de KLEFF con prefijo/lógica unificada, resolviendo conflictos:
  - `user_roles`: reutilizar la de KLEFF; añadir rol `organizer` al enum `app_role` (MMP tiene "organizador de evento").
  - Resto de tablas (events, participants, participant_selections, crush_requests, repeat_requests, wrapped_*, event_waitlist, game_votes, game_rewards, email_logs, organizers, etc.) se crean con sus GRANT + RLS adaptados al modelo de KLEFF.
- **Decisión incluida**: el módulo de planes de suscripción/Stripe de MMP NO se migra (KLEFF no vende suscripciones; se omite `subscription_plans`, `plan_features`, `features`, `modules` salvo que se indique lo contrario).
- Migración de datos: tú exportas los datos desde el proyecto Match Maker Pro (Cloud → Advanced settings → Export data) y me los subes; yo los importo tabla a tabla mapeando los 2 usuarios existentes a la cuenta de admin de KLEFF.

### Bloque 2 — Backend
- Reescribir las 38 edge functions como `createServerFn` (lógica interna) y rutas `/api/public/*` (webhooks/cron): códigos de acceso, check-in, selecciones, matches, crushes, repeats, wrapped, waitlist, recordatorios, remarketing.
- Reutilizar la infraestructura de email ya existente en KLEFF (Resend + cola de emails + plantillas), en lugar del sistema de plantillas por organizador de MMP.

### Bloque 3 — Frontend
- Portar las 23 páginas a rutas TanStack:
  - Públicas (sin cuenta): acceso de participante, selección de matches, crush/repeat response, cancelación, check-in, mesas.
  - Admin: panel de eventos dentro de `/admin` de KLEFF (reutilizando el layout y auth actuales).
- Idiomas: se portan en castellano primero (MMP es monolingüe); las versiones ca/en se añaden al final si lo deseas.

### Bloque 4 — Verificación
- Pruebas end-to-end del flujo completo: crear evento → registro participante → códigos → selecciones → emails de match.
- Escaneo de seguridad final y publicación.

## Notas técnicas
- Participantes de MMP no tienen cuenta (acceso por código/email): se mantiene ese modelo, no se crean usuarios auth para ellos.
- El super admin de KLEFF hereda el acceso de administración de eventos; el admin de evento existente recibe rol `organizer`.
- RLS estricto en todas las tablas nuevas; lecturas públicas solo vía políticas `TO anon` muy acotadas (datos de evento públicos).
- Nada toca el proyecto original de Match Maker Pro: la copia es de solo lectura; MMP seguirá funcionando hasta que decidamos apagarlo.
