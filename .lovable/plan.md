# Optimización de la base de datos de KLEFF

## Diagnóstico (verificado con consultas directas)

- **Tamaño total: 1,22 GB**, pero los datos reales de la app (todas las tablas públicas) suman solo **~9 MB**.
- **El 99% del espacio lo ocupa `cron.job_run_details` (1.231 MB)**: el historial de la tarea programada `process-email-queue`, que se ejecuta cada 5 segundos mientras hay emails en cola y registra cada ejecución.
- El WAL (128 MB) y la memoria (60%) están en niveles normales.
- Las consultas son rápidas en general; las más costosas: listado de juegos de la ludoteca (media 58 ms) y listados del blog (media 4–8 ms).

## Cambios propuestos

### 1. Purgar el historial de tareas programadas (recupera ~1,2 GB)
- Borrar el contenido acumulado de `cron.job_run_details` (es solo historial de ejecuciones; no afecta a la cola de emails ni a los correos pendientes).
- Crear una limpieza automática semanal que conserve solo los últimos 7 días de historial, para que no vuelva a crecer.
- Ejecutar `VACUUM` sobre esa tabla para devolver el espacio al disco (la métrica de 1,22 GB bajará de forma visible).

### 2. Reducir el ruido de logs de la cola de email (opcional pero recomendado)
- Ajustar la función `email_queue_dispatch` para que siga funcionando igual pero genere menos registros de historial (misma lógica, menos escritura).

### 3. Índices para las consultas más frecuentes
- `blog_posts(status, published_at DESC)`: acelera el listado público del blog y el sitemap.
- `bgg_games` índice parcial sobre `bgg_rating DESC` cuando `is_active = true`: acelera el listado de la ludoteca (~58 ms → ~5 ms esperado).
- Impacto: lecturas más rápidas; escrituras imperceptiblemente más lentas; +~100 KB de espacio.

### 4. Verificación
- Re-ejecutar el análisis de salud de la BD para confirmar la reducción de tamaño.
- Confirmar con EXPLAIN que las consultas del blog y la ludoteca usan los nuevos índices.

## Notas
- No se toca ningún dato de la aplicación (socios, blog, karma, alquileres, etc.).
- No hace falta ampliar disco ni instancia: tras la limpieza el uso de disco bajará del 52% a un dígito.
- El plan de integración de Match Maker Pro queda pendiente y se puede retomar después; con la BD limpia, la absorción de sus datos será trivial en espacio.
