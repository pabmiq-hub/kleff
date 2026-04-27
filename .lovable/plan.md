# Plan — KLEFF.es v2 (Fase 1)

Construimos una web pública nueva, multi-idioma, con estética cálida y comunitaria (coral/crema del logo). Mantenemos tu WordPress actual como editor del blog (headless) para conservar las publicaciones existentes y la indexación en Google. La parte privada (carnet, alquiler de juegos, super admin) queda planificada como **Fase 2**.

## Lo que construiremos en esta fase

### 1. Estética y sistema de diseño
- Paleta basada en tu logo: coral/salmón como color principal, crema como fondo, acentos cálidos.
- Tipografías amables (sans serif redondeada para titulares + sans legible para texto).
- Componentes reutilizables: botones, cards, hero, secciones de stats, "ficha de persona", grid de eventos, header/footer.
- Mucho aire, fotos grandes de gente jugando, esquinas redondeadas, microinteracciones suaves.
- Modo claro como predeterminado; estructura preparada por si más adelante quieres modo oscuro.

### 2. Multi-idioma (ES / EN / CA)
- Cada idioma tiene su propio prefijo de URL para máximo SEO:
  - `/` → español (idioma principal)
  - `/en/...` → inglés
  - `/ca/...` → catalán
- Selector de idioma en el header (banderitas o códigos ES/EN/CA).
- Detección automática del idioma del navegador la primera visita, con posibilidad de cambiar.
- Etiquetas `hreflang` en cada página para que Google sepa que son la misma página en otros idiomas.
- Textos de la web informativa traducidos a los 3 idiomas desde el principio.

### 3. Páginas (rutas separadas, no anclas)
Cada sección será una página propia con su título, descripción, imagen de compartir y URL indexable:

- **Home** (`/`) — Hero con claim "Jugar a juegos de mesa en Barcelona", 3 pilares (comunidad, ubicación céntrica, buen ambiente), próximos eventos de Meetup, sección "4 razones para unirte a Game Night" con imagen/reel + 5 puntos, CTAs hacia Meetup/WhatsApp/Telegram, footer con redes y contacto.
- **Quiénes somos** (`/quienes-somos` / `/en/about` / `/ca/qui-som`) — Historia, valores, stats (asistentes, juegos, crecimiento, alcance en redes), público objetivo, qué hacemos (semanal, mensual, anual), comunidades (Blood on the Clocktower, Catan, Unmatched, Roles Ocultos), colaboradores y editoriales, presencia en medios, **fichas interactivas del equipo** con foto, nombre, rol y bio que se expanden al pasar el ratón / tocar.
- **Blog** (`/blog`) — Listado de posts traídos desde tu WordPress + detalle de cada post (`/blog/[slug]`).
- **Contacto** (`/contacto`) — Datos, redes y formulario simple.

### 4. Integración con Meetup
- Sección en la home con los próximos eventos cargados automáticamente desde Meetup (título, fecha, hora, lugar, botón "Apuntarme").
- Caché en servidor para evitar peticiones constantes y carga rápida.
- Si Meetup no responde, mostramos mensaje amable y enlace directo al perfil.

### 5. Blog headless con WordPress
- Tu WordPress sigue siendo el editor: cuando publicas un post nuevo en WordPress, aparece automáticamente en la nueva web.
- Leemos los posts vía la **API REST de WordPress** (`/wp-json/wp/v2/posts`) — no hace falta plugin de pago.
- **URLs preservadas**: cada post mantiene el slug actual (`/blog/mi-post-existente`) para no perder posicionamiento.
- Renderizado en servidor (SSR) con metadatos correctos (title, description, og:image desde la imagen destacada del post) para que Google y redes sociales lo indexen igual o mejor que ahora.
- Listado paginado, búsqueda básica por título, filtro por categoría.
- Caché por post para que la web vaya rápida.

### 6. Traducción automática del blog con IA
- Cuando un post nuevo de WordPress se carga por primera vez en un idioma que no existe, lo traducimos al vuelo con la IA de Lovable y guardamos la traducción.
- Cada traducción tiene su propia URL (`/en/blog/my-post`, `/ca/blog/el-meu-post`) → SEO multi-idioma real.
- Las traducciones quedan guardadas para no re-traducir cada visita (ahorra coste y es instantáneo).
- Botón discreto "¿Mejor traducción?" para regenerar manualmente si una traducción no convence.

### 7. SEO y rendimiento
- Renderizado en servidor (SSR) en todas las páginas.
- `sitemap.xml` automático con todas las páginas y todos los posts en los 3 idiomas.
- `robots.txt` correcto.
- Metadatos Open Graph y Twitter Card por página (incluyendo posts del blog con su imagen destacada).
- Datos estructurados JSON-LD (Organization, BlogPosting) para resultados enriquecidos en Google.
- Imágenes optimizadas y carga diferida.

### 8. Migración desde el WordPress actual
- Antes de cambiar el dominio, mapeamos las URLs antiguas a las nuevas (debería ser 1:1 para los posts del blog).
- Plan de redirecciones 301 para cualquier URL que cambie, para no perder nada de SEO.
- Coordinamos el cambio de DNS contigo cuando todo esté listo.

---

## Detalles técnicos (sección para tu equipo técnico)

- **Stack**: TanStack Start (React 19 + SSR) sobre Cloudflare Workers, Tailwind CSS v4. Despliegue desde Lovable.
- **Backend**: Lovable Cloud (Supabase) para almacenar traducciones cacheadas, configuración del sitio y, en Fase 2, los datos de usuarios/auth.
- **WordPress**: Tu instalación actual permanece intacta. Consumimos `wp-json/wp/v2/posts?_embed` desde server functions con caché. Los slugs originales de posts se respetan tal cual.
- **Traducciones IA**: Lovable AI Gateway (Gemini Flash por coste/velocidad) invocado desde server function; resultado guardado en tabla `post_translations` con `(post_id, locale)` como clave. Para textos estáticos de la UI usamos archivos JSON por idioma (`es.json`, `en.json`, `ca.json`).
- **Meetup**: API REST pública del grupo, server function con caché de 10 minutos.
- **Routing i18n**: rutas con prefijo (`/en/*`, `/ca/*`) usando layouts de TanStack Router; tags `hreflang` y `lang` correctos.
- **Sitemap**: ruta server `/sitemap.xml` que combina rutas estáticas + slugs de WordPress en los 3 idiomas.

---

## Lo que NO incluye esta fase (Fase 2 propuesta más adelante)

- Sistema de autenticación, registro por invitación y panel de Super Admin.
- Carnet de Kleffer.
- Sistema de alquiler de juegos sincronizado con BoardGameGeek.
- Panel privado de usuario.

Lo dejamos diseñado en cuanto a arquitectura (la base de datos y el sistema de roles ya quedarán pensados) pero no construido, para que la fase 1 salga rápida y limpia.

---

## Antes de empezar necesitaré de ti

1. **URL exacta del WordPress actual** y confirmar que `kleff.es/wp-json/wp/v2/posts` responde (es público por defecto).
2. **Acceso o URL pública del grupo de Meetup** de KLEFF.
3. **Fotos del equipo** (o me dices si las saco de las redes sociales) y nombres + roles + bio corta de cada miembro.
4. **Confirmar paleta exacta**: ¿usamos el coral del logo tal cual o quieres ajustar tono?

Cuando aprobes el plan, empezaré por el sistema de diseño + la home en español, y luego iremos extendiendo a las demás páginas e idiomas.
