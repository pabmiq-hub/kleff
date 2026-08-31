# Integrar Konektum (Match Maker Pro) dentro de /admin

## Respuesta corta a tu pregunta

Sí, se puede hacer sin perder nada. La clave es que **en la Fase 1 no se toca la base de datos de Match Maker Pro**: los 19 eventos, los 336 participantes, los 190 matches y el evento en curso de kleffbcn@gmail.com siguen viviendo exactamente donde están. KLEFF se conecta a esos datos y los muestra con su propio diseño. La migración de datos a la base de datos de KLEFF se hace después, en frío, entre eventos, y con copia de seguridad previa.

Los enlaces ya enviados a participantes (registro, check-in, selecciones) no se tocan: siguen apuntando al dominio actual. Solo los eventos nuevos usarán kleff.es.

## Fase 1 — Konektum dentro de /admin (sin tocar datos)

1. Nueva entrada **Konektum** en la barra lateral de /admin, visible solo para super-admin.
2. Al entrar, se abre un área propia con su **sub-navegación** replicando la de Konektum: Inicio, Eventos, Analítica, Usuarios, Email, Plantillas, Configuración. Se integra como segundo nivel dentro del layout actual de KLEFF (barra lateral KLEFF a la izquierda, sub-menú Konektum arriba o en columna secundaria), para no tener dos barras laterales compitiendo.
3. **Look & feel KLEFF**: se sustituye el rosa/magenta y el estilo actual por la paleta y tipografía de KLEFF (cream, ink, coral, tipografía display), tarjetas y botones del sistema de diseño ya existente. Se reconstruyen las pantallas, no se incrusta la app antigua en un iframe.
4. Pantallas de la Fase 1, en este orden:
   - Inicio: evento destacado, contadores (eventos totales, participantes únicos, matches, tasa de selección), eventos recientes.
   - Eventos: listado, detalle del evento, participantes, check-in, mesas, selecciones y matches.
   - Analítica.
   - Usuarios, Email, Plantillas, Configuración.
5. **Acceso**: entras con tu cuenta actual de KLEFF (kleffbcn@gmail.com). Konektum queda detrás del rol super-admin de KLEFF; no hay segundo login.
6. La app actual de Match Maker Pro sigue funcionando en paralelo durante toda la fase, como red de seguridad.

## Fase 2 — Migración de datos y de enlaces (posterior, en frío)

1. Copia del esquema (30 tablas: events, participants, selections, crush/repeat requests, waitlist, email_logs, plantillas, branding, series…) a la base de datos de KLEFF, adaptando el sistema de roles al de KLEFF (super-admin de KLEFF + nuevo rol de organizador de eventos).
2. Volcado de todos los registros conservando IDs y relaciones, verificando conteos tabla por tabla.
3. Enlaces públicos de participantes bajo kleff.es solo para eventos nuevos; los eventos ya publicados se quedan en el dominio actual hasta que terminen, con redirecciones permanentes.
4. Correos transaccionales de Konektum pasan al Resend ya configurado de KLEFF.
5. Ventana de corte acordada contigo, fuera de cualquier evento activo, con copia de seguridad previa y posibilidad de vuelta atrás.

## Detalles técnicos

- Fase 1 usa un segundo cliente de base de datos apuntando al backend actual de Konektum (solo lectura/escritura mediante funciones de servidor de KLEFF, nunca con claves privilegiadas en el navegador). Requiere guardar como secretos la URL y las claves de ese backend; te pediré los valores con el flujo seguro de secretos cuando llegue el momento.
- Las 38 funciones de servidor de Konektum (envío de códigos, emails, asignación de mesas, matches) siguen ejecutándose en su proyecto durante la Fase 1; KLEFF las invoca. En la Fase 2 se portan a funciones de servidor de KLEFF.
- Rutas nuevas en KLEFF: `/admin/konektum` y sus hijas (`eventos`, `eventos/$id`, `analitica`, `usuarios`, `email`, `plantillas`, `configuracion`).
- El detalle de evento actual es muy grande (más de 6.000 líneas); se reconstruye por pestañas en componentes separados para que sea mantenible.

## Orden de entrega propuesto

1. Estructura + Inicio de Konektum con el diseño de KLEFF.
2. Eventos (listado y detalle con participantes, check-in, mesas y matches).
3. Analítica, Usuarios, Email, Plantillas, Configuración.
4. Fase 2: migración de datos y de enlaces.
