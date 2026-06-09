## Problema

En `/ludoteca` las tarjetas muestran el icono de "imagen rota". Verificado en la BD: los registros tienen dos URLs:

- `image_url` → `cf.geekdo-images.com/...` ✅ funciona
- `thumbnail_url` → `ludoya-images.s3.eu-west-par.io.cloud.ovh.net/...` ❌ host externo caído

El render actual prefiere el thumbnail (`g.thumbnail_url ?? g.image_url`), por eso todas las cards quedan en blanco.

## Cambio

Invertir la preferencia en los dos sitios donde se pinta el juego, usando siempre `image_url` y cayendo a `thumbnail_url` sólo si falta:

1. `src/components/pages/LudotecaPage.tsx` (grid principal, línea ~516-518): `src={g.image_url ?? g.thumbnail_url ?? ""}` y la condición equivalente.
2. `src/components/ludoteca/RecommendationsSection.tsx` (recomendaciones, dos `<img>`): misma inversión.

No se toca la BD ni el server function — el dato sigue ahí, sólo se evita el host roto en el cliente.