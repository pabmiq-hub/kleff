## Nueva página: Actividades

Página dedicada que expande la sección "Qué puedes encontrar" de `/como-funciona`, orientada a conversión (nuevos asistentes).

### Rutas (file-based routing)
- `src/routes/actividades.tsx` → `/actividades` (ES, nativo)
- `src/routes/ca.activitats.tsx` → `/ca/activitats`
- `src/routes/en.activities.tsx` → `/en/activities`

Cada ruta con `head()` propio (title/description/og) y slug editable desde el CMS de URLs ya existente.

### Componente
`src/components/pages/ActivitiesPage.tsx` — recibe contenido vía `useSectionContent` (CMS) con textos por defecto en ES; CA/EN se auto-traducen vía diccionarios `src/i18n/dictionaries.ts` (siguiendo el patrón ya usado).

### Estructura visual

1. **Hero**
   - Eyebrow "ACTIVIDADES", H1 "Vive KLEFF", subtítulo enfatizando que **la Noche de Juegos (miércoles) es nuestra actividad principal** y que dentro suceden el resto.
   - CTA primario "Ver próximos eventos en Meetup" → `https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming`
   - CTA secundario "Cómo funciona" → `/como-funciona`

2. **La Noche de Juegos (sección destacada, ancla `#noche-de-juegos`)**
   - Bloque grande explicando: miércoles, gratis, 4€ consumición, ludoteca abierta, #TeamKLEFF, partidas programadas.
   - Mini-grid de "qué pasa dentro": Blood on the Clocktower, Catan, Unmatched, Hidden Roles… (enlaza a las páginas existentes `/blood-on-the-clocktower`, `/catan`, `/roles-ocultos`).
   - CTA: "Apúntate a la próxima Noche de Juegos" → Meetup.

3. **Actividades dentro de la Noche de Juegos**
   Tarjetas detalladas (más extensas que las actuales) para:
   - **Torneos** (mensual) — enlace a `/torneos`.
   - **Demostraciones de editoriales y autores** (mensual) — texto ampliado.
   - **Slow Friending Lúdico** (puntual) — explicación del formato.

4. **Game Nights especiales (anuales)**
   Carnival, Halloween, X-Mas (solidario Sant Joan de Déu). Tarjetas con icono, descripción ampliada y nota: "son ediciones especiales de la Noche de Juegos".

5. **Eventos frecuentes especiales**
   Sección con **embed de Instagram reproducible** del reel `https://www.instagram.com/p/DXbPL40jG8p/` ("Tarde de juegos y gastronomía japonesa" en Casa Hanaka). Embed nativo de Instagram (`<blockquote class="instagram-media">` + script `//www.instagram.com/embed.js`) cargado vía `useEffect` para que se reproduzca dentro de la web.
   Texto explicando que hacemos colaboraciones con espacios y entidades aliadas.

6. **Colaboraciones con otras entidades**
   Bloque breve: organizamos junto a otras asociaciones actividades en otros días de la semana. (Texto editable CMS, sin logos por ahora.)

7. **Eventos a medida / Team building**
   Card destacada: organizamos eventos privados tipo team building, cumpleaños, despedidas, empresas. CTA "Contáctanos" → `/contacto`.

8. **Calendario Meetup (CTA final)**
   Banner full-width: "¿Quieres saber más sobre los eventos?" + botón grande "Ver calendario completo en Meetup" → `https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming`.
   Debajo, link secundario al grupo Meetup `https://www.meetup.com/es-es/kleff-bcn/`.

### Enlace desde `/como-funciona`
En la sección actual "Qué puedes encontrar" añadir al final un CTA: **"¿Quieres saber más sobre los eventos? → Ver todas las actividades"** que enlace a `/actividades` (con variante CA/EN según locale).

### i18n
- Añadir claves nuevas en `src/i18n/dictionaries.ts` (ES nativo + CA + EN) para todos los textos de la página.
- `src/i18n/config.ts`: añadir paths localizados (`activitats`, `activities`).

### Navegación
- `SiteHeader.tsx` y `SiteFooter.tsx`: añadir entrada "Actividades / Activitats / Activities" en el menú principal (cerca de "Cómo funciona").

### CMS
- `src/cms/schemas.ts`: registrar sección `activities` con campos editables (hero, descripciones de cada actividad, textos de los bloques colaboraciones / team building / CTA final).
- Imagen/iconos: reutilizar los emojis ya usados (🎲🏆📦💘🎭🎃🎄) + iconos lucide para los nuevos bloques.

### Elementos visuales
- Gradientes y tarjetas con estilo coherente con `HowItWorksPage`.
- Imagen hero: generar 1 imagen ambiente noche de juegos (`src/assets/activities-hero.jpg`) con `imagegen` standard.
- Badges de frecuencia (SEMANAL/MENSUAL/PUNTUAL/ANUAL) como ya existen.
- Embed Instagram con estilo card y fallback link.

### Archivos a tocar (resumen técnico)
- **Crear**: `src/routes/actividades.tsx`, `src/routes/ca.activitats.tsx`, `src/routes/en.activities.tsx`, `src/components/pages/ActivitiesPage.tsx`, `src/components/site/InstagramEmbed.tsx`, `src/assets/activities-hero.jpg`.
- **Editar**: `src/i18n/dictionaries.ts`, `src/i18n/config.ts`, `src/cms/schemas.ts`, `src/components/site/SiteHeader.tsx`, `src/components/site/SiteFooter.tsx`, `src/components/pages/HowItWorksPage.tsx` (CTA al final del bloque actividades).
- `src/routeTree.gen.ts` se regenera automáticamente.

### SEO
- ES: "Actividades — Noches de juegos, torneos y eventos | KLEFF"
- CA: "Activitats — Nits de jocs, tornejos i esdeveniments | KLEFF"
- EN: "Activities — Game nights, tournaments and events | KLEFF"
- og:image apuntando al hero generado.
