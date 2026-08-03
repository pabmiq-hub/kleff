## Objetivo

Cuatro bloques nuevos, pensados para implementarse en este orden (cada uno es funcional por sí mismo).

Requisito previo del bloque 1: el admin de Ludoya debe activar el login en su página de API y darnos **Client ID**, **Client Secret** y registrar el **Redirect URI** `https://www.kleff.es/auth/ludoya/callback`. Los guardaré como secretos (`LUDOYA_OIDC_CLIENT_ID`, `LUDOYA_OIDC_CLIENT_SECRET`) cuando llegue el momento.

---

## Bloque 1 — Sincronización real con Ludoya (OIDC + partidas)

**1.1 Vinculación por login (sustituye al campo de usuario manual)**

- Ruta pública `/auth/ludoya/callback` + dos server functions: `startLudoyaLink` (genera `state`/PKCE, devuelve la URL de autorización) y `completeLudoyaLink` (canjea el `code` contra `https://api.ludoya.com`, lee el `id_token`, guarda datos).
- Descubrimiento automático desde `/.well-known/openid-configuration`; scope `openid profile email`.
- Se abre en **popup** (el editor va en iframe) y al volver se refresca el perfil.
- Nuevas columnas en `profiles`: `ludoya_user_id`, `ludoya_avatar_url`, `ludoya_display_name`, `ludoya_linked_at`. Se mantiene `ludoya_username` para compatibilidad.
- Al vincular, el usuario queda unido al grupo KLEFF automáticamente (o como solicitud, según la política del grupo). Se conserva el envío de invitación como respaldo.

**1.2 Perfil Ludoya visible en Comunidad**

- `ludoya.server.ts`: nuevo `getLudoyaMember(username)` sobre `/public/v1/members` (con caché en `kv_cache`, ~15 min) que devuelve avatar, juegos/colección y estadísticas públicas disponibles.
- En `/app/kleffers`, al pulsar una tarjeta se abre un panel lateral con el perfil del socio: datos de KLEFF + bloque "Ludoya" (avatar, nick, enlace a su perfil, juegos). Solo para socios vinculados.

**1.3 Crear partidas desde la plataforma**

- Diálogo de creación en `/app/partidas` ampliado: elegir destino → **muro de la comunidad** o **un evento concreto** (desplegable con los eventos futuros ya cargados, enviando `parentId`).
- Buscador de juego contra `/search/boardgames` (ya existe) y validación de fecha/plazas.
- Tras crear la partida con éxito, se ofrece **reclamar el karma** de la categoría "Creación de partida en Ludoya": se crea una `karma_entries` enlazada por `event_ref` = ID del evento de Ludoya, evitando duplicados por evento. Puntos y límites salen de la categoría configurada en `/admin/karma` (según el flujo de validación que tenga esa categoría: automático o pendiente de aprobación).

---

## Bloque 2 — Perfil de kleffer completo

**2.1 Onboarding en dos pasos**

- Paso 1 (obligatorio, el actual): usuario, nombre, fecha de nacimiento, género, documento, foto, contraseña. Se sustituye el input de Ludoya por el botón **"Vincular con Ludoya"** del bloque 1.
- Paso 2 (**omitible**, "Completa tu perfil de kleffer"), también editable siempre desde `/app/profile`:
  - ¿Sueles venir solo/a a los eventos? (solo / con amigos / depende)
  - ¿Te gusta apuntarte a partidas programadas? (sí / prefiero improvisar / según el juego)
  - ¿Qué buscas en KLEFF? (multi: nuevas amistades, jugar mucho, participar en la comunidad, organizar partidas, competir en torneos, descubrir novedades)
  - Hasta 5 **juegos favoritos** con buscador contra Ludoya (guardando id, nombre e imagen)
  - Tipos de juego preferidos (eurogames, party, roles ocultos, cooperativos, wargames, familiares, deducción…)
  - Nivel de experiencia (novato / habitual / veterano)
  - Días y franjas en las que sueles poder venir
  - Idiomas en los que juegas (ca / es / en / otro)
  - "Enseño juegos a otros": sí / a veces / prefiero que me enseñen
  - Una frase de presentación (máx. 200 caracteres)
- Aviso al 100 %: barra de progreso del perfil e invitación a completarlo desde el dashboard.

**2.2 Datos y visibilidad**

- Tabla nueva `member_profiles` (1:1 con `profiles`) con estos campos + `is_public` por defecto activo. **Asunción**: visibles para el resto de socios en Comunidad, con un interruptor para ocultarlos. Dímelo si prefieres que sean solo para admin.
- Comunidad muestra estos datos en la ficha y añade filtros (busca gente que juegue tus mismos juegos / venga sola / tus mismos días).

---

## Bloque 3 — Encuestas y votaciones de adquisiciones

**3.1 Modelo de datos**

- `polls`: tipo (`survey` | `acquisition`), título/descripción multiidioma, fechas de apertura y cierre, `karma_category_id` (recompensa por participar), `max_choices`, estado.
- `poll_options`: texto libre o juego cargado desde Ludoya/BGG (id, nombre, imagen, año, jugadores).
- `poll_votes`: un registro por socio y opción, con `weight` (1 o 2).
- `poll_responses`: respuestas de las encuestas generales (preguntas reutilizando el motor de `registration_questions`).

**3.2 Voto doble**

- Al votar se comprueba si el socio tiene un perk `double_vote` activo y sin consumir en `karma_perks`; si lo tiene, el voto pesa 2 y el perk se marca como consumido en esa votación.

**3.3 Karma automático**

- Al completar una encuesta o emitir un voto se crea la contribución de karma correspondiente a la categoría asociada (una sola vez por votación/socio), respetando el flujo de validación configurado.

**3.4 Interfaz**

- Admin: nueva sección `/admin/polls` — crear encuestas y votaciones, añadir opciones (con buscador de juegos), fijar puntos, ver resultados en directo y exportar.
- Socio: bloque destacado en el panel central de `/app` **solo si hay algo activo**, más `/app/votaciones` con historial. Notificación a todos los socios al publicar (usando el sistema de `notifications` ya existente).

---

## Bloque 4 — Equipo de organización (voluntarios)

**4.1 Solicitud**

- Botón destacado "Únete al equipo de organización" en el dashboard `/app` y en el pie del panel de socio; abre un **pop-up** con el formulario digitalizado a partir de tu Google Form:
  - Áreas de colaboración (multi, con las 10+ opciones que me has pasado + "Otro")
  - Categorías de eventos en las que puede ayudar (multi)
  - Rol dentro del evento: montaje, recepción y cobro, acomodar, demostrar juegos, desmontaje, otro
  - Beneficios que le gustaría recibir (multi)
  - Idiomas de atención (ca / es / en / otro)
  - Áreas institucionales: RRHH, Marketing & Comercial, solo eventos
  - Opinión sobre la cuota de socio (sí/no) + importe anual justo + beneficios que debería incluir
  - Comentarios y propuestas de mejora (texto libre)
- Se precargan nombre, email y teléfono del perfil; no se puede enviar dos veces mientras haya una solicitud pendiente.

**4.2 Gestión**

- Tabla `volunteer_applications` (respuestas en `jsonb`, estado `pending | reviewing | accepted | declined`, notas internas).
- Notificación + email al admin en cada solicitud nueva.
- Nueva pestaña **"Solicitudes"** dentro de `/admin/team`, separada de las fichas públicas de "Quiénes somos": listado con filtros por área y disponibilidad, ficha completa de cada persona, cambio de estado y notas. Nada de aquí sale a la web pública.
- Al aceptar, el socio recibe una notificación y (opcional) el admin puede crear después una ficha pública desde la pestaña actual.

---

## Detalles técnicos

- **Auth Ludoya**: OpenID Connect estándar; intercambio de `code` siempre en el servidor (`createServerFn`), `client_secret` solo en variables de entorno, `state` firmado y de un solo uso, tokens de Ludoya **no** se guardan (solo el `sub`/username para luego leer vía API key del grupo).
- **Base de datos**: cada tabla nueva con `GRANT` + RLS (socio lee/escribe lo suyo, admin todo vía `has_role(..., 'super_admin')`), `created_at/updated_at` y trigger de actualización.
- **Karma**: **asunción** — todas las nuevas recompensas (partida en Ludoya, encuesta, votación) son categorías configurables desde `/admin/karma`, no puntos fijos en código. Se crean con valores por defecto en la migración.
- **Notificaciones**: se reutiliza `public.notifications` y la campana existente; nuevos tipos `poll_created`, `volunteer_application`, `ludoya_linked`.
- **Idiomas**: los textos nuevos entran en `src/i18n/dictionaries.ts` (es/ca/en).

## Orden sugerido de entrega

1. Bloque 1.1 + 1.2 (login Ludoya y perfiles en Comunidad) — requiere las credenciales OIDC.
2. Bloque 1.3 (crear partidas + karma).
3. Bloque 2 (perfil de kleffer).
4. Bloque 3 (encuestas y votaciones).
5. Bloque 4 (equipo de organización).