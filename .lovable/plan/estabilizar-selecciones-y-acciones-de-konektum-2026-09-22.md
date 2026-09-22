# Estabilizar selecciones y acciones de Konektum

## Objetivo
Eliminar los bloqueos y fallos intermitentes al guardar selecciones, Super Likes y acciones relacionadas, manteniendo la experiencia actual.

## Cambios
- Sustituir los límites por IP compartida que bloquean a asistentes conectados al mismo Wi‑Fi por validaciones ligadas al participante y operaciones idempotentes.
- Hacer atómico el guardado de selecciones para evitar estados parciales, duplicados y carreras entre reintentos.
- Separar el guardado de la selección del envío del correo de Super Like, para que un proveedor de correo lento nunca deje el botón esperando.
- Añadir tiempo máximo, cierre garantizado del estado «Guardando» y mensajes de error reales en las dos pantallas de participantes.
- Corregir acciones de Flechazo/Repetir para comprobar la respuesta del correo y registrar el resultado sin perder la acción ya guardada.
- Mantener el remitente `hola@kleff.es` y los datos en la base propia.

## Verificación
- Probar selecciones vacías, nuevas, ediciones, reintentos y Super Like.
- Simular varias personas bajo una misma IP y respuestas lentas/fallidas.
- Comprobar que la interfaz siempre sale del estado de carga y muestra el resultado correcto.
- Validar tipos y probar los endpoints publicados sin modificar selecciones reales.
