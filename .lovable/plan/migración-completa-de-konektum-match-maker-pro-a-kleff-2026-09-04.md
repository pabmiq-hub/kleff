# Migración completa de Konektum (Match Maker Pro) a KLEFF

## Situación actual

La base de datos ya está migrada: las 32 tablas de Konektum viven en KLEFF con prefijo `kon_` y los 10.955 registros están dentro (20 eventos, 358 participantes únicos, 2.883 selecciones, 190 matches).

Lo que falta es la aplicación. Hoy en `/admin/konektum` solo existen:
- Inicio: funciona, lee de las tablas migradas.
- Eventos: listado básico.
- Analítica, Usuarios, Email, Plantillas, Configuración: son páginas de relleno con el texto "se integrará en la siguiente entrega".

El proyecto original tiene unas 60.000 líneas: 25 páginas, ~90 componentes de administración y de participante, y 40 funciones de servidor. Se migra todo, reconstruido con el diseño de KLEFF, y se entrega por bloques para poder validar cada uno.

La app original de Match Maker Pro se queda intacta y sigue funcionando de forma independiente con su propia base de datos.

## Bloque 1 — Eventos: listado y detalle (núcleo)

Es la pantalla más grande del original (`EventDetail`, 6.280 líneas) y se reconstruye por pestañas en componentes separados:

- Listado de eventos con filtros (activos, pasados, borradores, de prueba) y creación de evento.
- Detalle del evento con pestañas: Participantes, Check-in, Lista de espera, Mesas, Selecciones, Matches, Ajustes.
- Ficha de participante: alta manual, edición, exclusiones e inclusiones, cancelaciones.
- Asignación y edición de mesas, rondas y temporizador.
- Panel de matches (mutuos, crush, repeat) y visor de selecciones.

## Bloque 2 — Analítica y Usuarios

- Analítica global: eventos, participación, tasa de selección, retención, evolución por mes.
- Analítica social por evento: compatibilidades, encuentros, engagement.
- Usuarios: participantes globales del CRM, ficha con historial de eventos, notas y etiquetas.

## Bloque 3 — Email, Plantillas y Configuración

- Plantillas de email y de formulario de registro, con editor y versiones.
- Gestión de envíos: confirmaciones, recordatorios, códigos de acceso, matches, remarketing.
- Registro de envíos (2.245 correos históricos ya migrados).
- Configuración: branding, series de eventos, ajustes de comunicación, preferencias.
- Los correos pasan a enviarse por el Resend ya configurado en KLEFF.

## Bloque 4 — Páginas públicas de participantes

Rutas nuevas en kleff.es para los eventos que se creen desde KLEFF:

- Inscripción al evento y a series recurrentes.
- Acceso con código, check-in, consulta de mesa.
- Selecciones (la pantalla de elegir personas), juegos rompehielos y avatar.
- Respuestas a crush / repeat y cancelación de plaza.

Los enlaces ya enviados a participantes de eventos pasados siguen apuntando a la app antigua; no se rompen.

## Bloque 5 — Funciones de servidor

Las 40 funciones del original se portan a funciones de servidor de KLEFF: generación y envío de códigos, registro y check-in de participantes, asignación de mesas, cálculo de matches, rompehielos, envíos programados y remarketing, notificaciones al organizador.

## Detalles técnicos

- Rutas: `/admin/konektum/eventos`, `/admin/konektum/eventos/$id`, `/admin/konektum/analitica`, `/usuarios`, `/email`, `/plantillas`, `/configuracion`, todas bajo el rol super-admin de KLEFF.
- Lectura y escritura mediante funciones de servidor de KLEFF (`*.functions.ts` + `*.server.ts`), nunca con claves privilegiadas en el navegador. Las tablas `kon_*` tienen RLS restringida a super-admin.
- Las páginas públicas de participante son rutas públicas con acceso por token/código, servidas por funciones de servidor sin autenticación de usuario y con validación del código en el servidor.
- Se reutiliza el sistema de diseño de KLEFF (cream / ink / coral, tipografía display) y los componentes shadcn ya presentes; no se copian los estilos rosa/magenta ni el sidebar del original.
- Los envíos de correo usan la cola de emails ya existente en KLEFF.
- Sin cambios en el esquema salvo pequeños ajustes puntuales si falta alguna columna al portar una pantalla.

## Orden de entrega

Bloque 1 → 2 → 3 → 5 → 4, validando cada bloque en el preview antes de pasar al siguiente. El bloque 5 se adelanta al 4 porque las páginas públicas dependen de esas funciones.
