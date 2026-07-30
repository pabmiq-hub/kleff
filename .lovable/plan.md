## Objetivo

Implementar el Sistema de Karma del documento en la zona de socios (`/app/karma`) y en el panel de administración (`/admin/karma`), con baremos configurables, validación humana, canje de recompensas, temporadas con caducidad y niveles/ranking opcional.

## 1. Base de datos

Nuevas tablas (todas con RLS y permisos):

- `karma_seasons` — nombre, fecha inicio/fin, activa, remanente máximo transferible.
- `karma_categories` — grupo (ludoteca, difusión, referidos, participación, organización, otras), nombre en ES/CA/EN, descripción, puntos, tipo de tope (ninguno / semanal / mensual), valor del tope, si permite rango de puntos (donaciones 20–50), si el socio puede solicitarla o es solo de admin, requiere evidencia, activa, orden.
- `karma_entries` — socio, categoría, puntos, estado (pendiente / aprobada / rechazada / anulada), descripción, evidencia (URL o imagen subida), referencia opcional a juego de la ludoteca o evento, quién validó, fecha, nota de decisión, temporada.
- `karma_rewards` — nombre multiidioma, descripción, coste en puntos, tipo de efecto (manual, descuento cuota, papeleta sorteo, préstamo extra, ampliación de plazo, descuento torneo), stock opcional, activa.
- `karma_redemptions` — socio, recompensa, puntos gastados, estado (solicitada / aprobada / entregada / rechazada), efecto aplicado, notas.
- `karma_referrals` — socio referidor, nuevo socio, estado y bonus de fidelización pendiente.
- Añadir a `profiles`: `karma_ranking_opt_in` (aparecer o no en el ranking público).

Saldo y karma histórico se calculan a partir de `karma_entries` aprobadas menos canjes, mediante funciones de base de datos (`karma_balance`, `karma_lifetime`), para que no haya desincronización.

Semilla inicial: todas las categorías, puntos, topes y recompensas exactamente como en el documento (incluidos los 75 puntos de eventos con menú, 15 por referido +10 de fidelización, tope de 3 revisiones/mes, 1 story/semana), y una temporada inicial abierta. Todo editable después desde el admin.

## 2. Zona de socios — `/app/karma`

- Cabecera con saldo disponible, karma histórico, nivel actual (Aprendiz de mesa / Estratega KLEFF / Maestro del Tablero / Leyenda de KLEFF) y barra de progreso al siguiente nivel.
- Botón **Registrar contribución**: elegir categoría (solo las marcadas como solicitables), descripción, evidencia (enlace o subida de foto) y envío; queda en estado pendiente con los puntos que se otorgarían.
- Historial personal con estados y filtros; aviso cuando se alcanza un tope semanal/mensual.
- Catálogo de recompensas con lo que puede canjear según su saldo y botón de canje.
- Ranking mensual con interruptor personal para aparecer o no, y destacado de "Socio del mes".
- Insignia de nivel visible en el carnet digital y en el perfil.
- Notificación al socio cuando su contribución se aprueba o rechaza y cuando su canje se entrega.

## 3. Panel de administración — `/admin/karma`

Cuatro pestañas:

1. **Solicitudes pendientes** — lista con socio, categoría, evidencia, puntos propuestos; aprobar (pudiendo ajustar los puntos, necesario para donaciones 20–50 y bonus de reporte detallado), rechazar con motivo. Aviso automático si la solicitud supera el tope de la categoría.
2. **Asignación directa** — otorgar puntos a un socio sin solicitud previa, y anular puntos ya concedidos por error o fraude (con aviso al socio).
3. **Categorías y baremos** — CRUD completo de categorías, puntos, topes y activación.
4. **Recompensas y canjes** — CRUD del catálogo y gestión de canjes solicitados (aprobar, marcar entregado, rechazar y devolver puntos).

Más: gestión de temporadas (crear, cerrar temporada aplicando la caducidad con el remanente configurado) y ranking/socio del mes.

En **Socios** se añade el saldo, el nivel y un acceso al historial de karma de cada miembro dentro del panel lateral existente.

## 4. Efectos automáticos de canje

Donde la plataforma ya tiene el módulo correspondiente:

- **+1 semana de plazo** — al aprobarse, amplía la fecha de devolución del préstamo activo elegido.
- **Préstamo adicional simultáneo** — concede un permiso temporal (1 semana) que aumenta en 1 la cuota mensual del socio en el motor de alquileres.
- **Acceso prioritario a novedades (48 h)** y **voto con doble peso** — se guardan como permiso vigente en el perfil para su uso futuro.
- **Descuento de cuota** — genera un vale con el importe (50 puntos = 1 €) visible en la ficha del socio en admin, con tope configurable de descuento máximo por temporada; la aplicación económica sigue siendo manual.
- **Papeletas de sorteo, pin, camiseta, playtesting, entrada de acompañante** — canje registrado y entrega marcada manualmente por el admin.

Nunca se descuentan puntos sin saldo suficiente: el saldo se retiene al solicitar el canje y se devuelve si se rechaza.

## 5. Notas técnicas

- Servidor: nuevos `src/lib/karma.functions.ts` (socio, con `requireSupabaseAuth`) y `karma-admin.functions.ts` (verificación de super admin), siguiendo el patrón ya usado en el proyecto.
- Cálculo de saldo, topes y validación de canje en funciones de base de datos para evitar condiciones de carrera y manipulación desde el cliente.
- Evidencias: subida al bucket `media` existente mediante el `ImagePicker` ya disponible.
- Notificaciones reutilizando la tabla `notifications` y la campana existente.
- Textos en ES/CA/EN en los datos, siguiendo el patrón multiidioma ya usado en `team_members`.

## Fuera de alcance (para una fase posterior)

Cálculo automático de "asistencia a 3 eventos" del referido a partir de Ludoya (por ahora el bonus de fidelización lo valida el admin), integración con encuestas y el módulo de sorteos.
