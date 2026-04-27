## Problema

En móvil (360px) hay dos tipos de desalineación:

1. **Rotaciones decorativas** (`-rotate-1`, `rotate-2`, `rotate-12`, `-rotate-6`, etc.) en hero, eventos, pilares, CTAs, sello de imagen, header (logo) y footer.
2. **Overflow horizontal de elementos grandes**:
   - La **"J" de "Juegos"** del título hero se sale del contenedor por la izquierda. Causa: `text-5xl sm:text-6xl` (40-48px) con `tracking-tight` y la serif `Fraunces` que tiene serifas anchas, sin padding lateral suficiente y con `leading-[0.92]`.
   - El **CTA "Apúntate a la próxima Game Night"** sobresale por la derecha. Causa: botón con `px-7 py-4` + texto largo en flex-wrap que en 360px no rompe bien y el `border-2` + `shadow-tactile` (6px de offset) suma ancho extra que desborda el padding del contenedor.

## Objetivo

Eliminar todas las rotaciones de bloques de contenido y arreglar el overflow horizontal en móvil para que **nada sobresalga del contenedor** en ningún ancho.

## Cambios

### `src/components/pages/HomePage.tsx`

**Hero — fix overflow + rotaciones:**
- Título hero: bajar el tamaño base en móvil de `text-5xl` a `text-4xl` y mantener escalado (`sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl`). Cambiar `tracking-tight` a `tracking-normal` para evitar que las serifas se salgan. Añadir `break-words` por seguridad.
- Eyebrow badge: quitar `-rotate-2`.
- Marco imagen principal: quitar `-rotate-2`.
- Quitar la cinta superior (`tape ... rotate-1`).
- Token "10K+ personas": quitar `rotate-12`.
- Token "300+ juegos": quitar `-rotate-6`.
- Sticker "Cada miércoles": quitar `rotate-6` y convertirlo en chip recto.

**CTAs — fix overflow:**
- Reducir padding en móvil del CTA primario: de `px-7 py-4` a `px-5 py-3.5 sm:px-7 sm:py-4`.
- Añadir `max-w-full` al contenedor de botones y `whitespace-normal text-center` al CTA primario para permitir wrap del texto largo.
- Asegurar que el `shadow-tactile` (6px offset) no fuerce desbordamiento: envolver con `overflow-x-clip` en la sección hero.

**Pillars:**
- Quitar la prop `rotation` de `PillarCard` y de las tres llamadas.

**Events:**
- Eliminar `cardRotations` y la prop `rotation` de `EventCard`. Cards rectas.

**Reasons + Image:**
- Quitar `rotate-2` del marco de la imagen.
- Quitar las dos cintas (`-rotate-3`, `rotate-3`).
- Sello "100% cartón real": quitar `-rotate-6`, dejar recto.

**Stats (sección oscura):**
- Quitar `rotate-12` y `-rotate-6` de las formas decorativas.

**Final CTA:**
- Quitar `-rotate-1` de la tarjeta coral grande.
- Stickers de esquina: quitar `rotate-12` / `-rotate-12`.

### `src/components/site/SiteHeader.tsx`

- Logo: quitar `rotate-3` y `group-hover:rotate-6` del contenedor del logo.

### `src/components/site/SiteFooter.tsx`

- Quitar `rotate-12` y `-rotate-6` de las dos formas decorativas flotantes.
- Logo del footer: quitar `rotate-3`.

### Anti-overflow global (en `src/styles.css`)

- Añadir `html, body { overflow-x: hidden; }` como red de seguridad para que ninguna rotación o sombra residual cause scroll horizontal en móvil.

### About / Blog / Contact

Sin rotaciones detectadas y sin titulares que desborden. No requieren cambios.

## Lo que se mantiene

- Bordes negros gruesos `border-2 / border-4 border-ink`.
- Sombras duras `shadow-tactile` (sin rotación).
- Hover con desplazamiento.
- Marker highlights (`marker-coral`) en el título del hero.
- Stamps (`stamp-ink`, `stamp-coral`) en eyebrows.
- Tokens flotantes rectos, paleta cálida.

## Resultado esperado

En móvil 360px y desktop: la "J" de "Juegos" queda dentro del contenedor, el CTA "Apúntate a la próxima Game Night" no desborda (con wrap si hace falta), y todos los bloques (texto, imágenes, cards, badges, logo) están rectos y alineados al grid en todas las páginas.
