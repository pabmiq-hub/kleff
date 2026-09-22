# Inscripciones: invitados editables, recordatorios manuales y comunicados

Tres mejoras sobre el panel de una inscripción (`/admin/registrations/<id>`).

## 1. Editar invitados de cada inscrito

En la tabla de "Inscritos", la columna de asistentes pasa a ser editable: un
pequeño selector `+0 / +1 / +2 …` (hasta el máximo de invitados configurado en
el formulario).

- Al cambiarlo se guarda al instante y el total de PARTICIPANTES se recalcula.
- Si el cambio supera las plazas disponibles, se avisa y se pide confirmación
  antes de guardar (no se bloquea: tú mandas).
- Queda registrado quién viene solo/a y quién con acompañantes, igual que si lo
  hubiera indicado la persona al inscribirse.

## 2. Recordatorio manual con previsualización

Hoy el botón de enviar recordatorio existe pero envía directamente, sin ver
antes el correo.

- Botón "Enviar recordatorio" sobre la tabla de inscritos (a todas las personas
  activas) y una acción por fila (a una sola persona).
- Ambos abren una ventana con la **previsualización real** del correo tal y como
  lo recibirá el participante, el número de destinatarios y los botones
  "Cancelar" / "Enviar ahora".
- Tras enviar, se muestra cuántos correos han salido.

## 3. Comunicados

Nueva sección "Comunicados" dentro de la inscripción, para escribir un mensaje
puntual a quienes ya están apuntados (cambio de sala, instrucciones, encuesta…).

- Asunto y cuerpo con editor de texto enriquecido (negrita, enlaces, listas).
- Bloques opcionales que se añaden con un interruptor:
  - Detalles del evento (fecha, lugar) y botones de calendario.
  - Enlace para darse de baja.
  - Enlace al formulario para completar o revisar respuestas / preguntas
    pendientes.
- Destinatarios: todas las personas inscritas activas, o sólo una selección de
  filas marcadas en la tabla.
- Previsualización obligatoria antes de enviar, con recuento de destinatarios.
- Historial: cada comunicado enviado queda listado con asunto, fecha y número de
  destinatarios.

## Detalles técnicos

- Base de datos: nueva tabla `registration_announcements`
  (`form_id`, `subject`, `body_html`, `blocks jsonb`, `recipients_count`,
  `sent_at`, `created_by`) con GRANTs y RLS sólo para super admin; servicio para
  las funciones de servidor. Sin cambios en `registration_responses`.
- `src/lib/registrations.functions.ts`:
  - `adminUpdateResponse`: aceptar `guests_count` (entero 0..`max_guests_per_response`).
  - `adminPreviewEmails`: aceptar `response_id` opcional para previsualizar el
    recordatorio con los datos reales de esa persona.
  - Nuevas: `adminPreviewAnnouncement`, `adminSendAnnouncement`,
    `adminListAnnouncements`.
- `src/lib/email/templates.server.ts`: nueva plantilla `announcementEmail`
  reutilizando la maqueta de `registrationEventEmail` (cabecera, bloque de
  evento, botones, pie) con bloques condicionales. Cuerpo saneado en servidor
  antes de insertarlo.
- Envío vía `sendEmailSafe` (Resend, `hola@kleff.es`) en serie con
  `Promise.allSettled` por lotes, devolviendo enviados/fallidos.
- `src/routes/admin.registrations.$id.tsx`: selector de invitados en
  `ResponsesTable`, diálogo de previsualización/confirmación compartido para
  recordatorio y comunicado, y nueva pestaña "Comunicados".
- Los recordatorios automáticos programados en Resend no se tocan en este
  cambio; el envío manual es independiente.
