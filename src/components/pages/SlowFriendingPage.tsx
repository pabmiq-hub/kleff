import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  HeartHandshake,
  MapPin,
  Repeat,
  Smartphone,
  Sparkles,
  Star,
  Timer,
  Users,
  Zap,
  Gamepad2,
  Dices,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import logoAsset from "@/assets/slow-friending-ludico-logo.png.asset.json";
import estacioAsset from "@/assets/slf-estacio.jpg.asset.json";
import hugosAsset from "@/assets/slf-hugos-diner.webp.asset.json";
import { getOptimizedImageUrl } from "@/lib/image-delivery";

const MEETUP_URL = "https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming";

type Locale = "es" | "en" | "ca";

type Copy = {
  eyebrow: string;
  title: string;
  intro: string;
  ctaQuestion: string;
  bullets: string[];
  ctaYes: string;
  ctaJoin: string;
  howEyebrow: string;
  howTitle: string;
  howSubtitle: string;
  steps: { title: string; body: string }[];
  extrasEyebrow: string;
  extras: { title: string; body: string }[];
  formatsEyebrow: string;
  formatsTitle: string;
  formatsSubtitle: string;
  formats: { title: string; body: string; tag: string }[];
  venuesEyebrow: string;
  venuesTitle: string;
  venuesSubtitle: string;
  venues: { name: string; body: string; tag: string }[];
  finalTitle: string;
  finalBody: string;
};

const copy: Record<Locale, Copy> = {
  es: {
    eyebrow: "Slow Friending Lúdico",
    title: "Más que juegos, son conexiones",
    intro:
      "Conoce gente nueva en Barcelona jugando a juegos de mesa. Rotación de mesas, conversaciones reales y una plataforma propia (KONEKTUM) para que nada se pierda al terminar la noche.",
    ctaQuestion: "¿Acabas de llegar a Barcelona? ¿Quieres ampliar tu círculo de amistades o conocer a alguien especial? ¿Quieres probar juegos nuevos?",
    bullets: [
      "Mesas con personas de tu franja de edad",
      "Géneros mezclados, dinámica respetuosa",
      "Juegos fáciles, partidas cortas",
      "App propia para conexiones reales",
    ],
    ctaYes: "Si la respuesta es SÍ, esta actividad es para ti.",
    ctaJoin: "Apúntate al próximo evento",
    howEyebrow: "Cómo funciona",
    howTitle: "Cuatro pasos, una experiencia",
    howSubtitle: "Dinámica similar a un speed dating: rotación de mesas y participantes en cada ronda (≈ 35 min) y selección de afinidad con quien has coincidido.",
    steps: [
      {
        title: "Te inscribes en el evento",
        body: "Recibes tu código de acceso a KONEKTUM, nuestra plataforma para gestionar todo el proceso.",
      },
      {
        title: "Te asignamos una mesa",
        body: "Personas de tu misma franja de edad y distintos géneros, listas para jugar.",
      },
      {
        title: "Juegas, conectas y rotas",
        body: "Rondas de ~35 minutos. Cada ronda, nuevos compañeros de mesa y nuevos juegos.",
      },
      {
        title: "Entras en KONEKTUM",
        body: "Desde tu panel ves tus mesas, marcas afinidades (amistad o romance) y usas las funciones extra.",
      },
    ],
    extrasEyebrow: "Funcionalidades extra",
    extras: [
      {
        title: "Repetir",
        body: "Pide volver a coincidir con alguien en una mesa futura. Requiere aprobación de la otra persona.",
      },
      {
        title: "Super Like",
        body: "Hazle saber a alguien que ha habido un interés real en seguir conociéndoos.",
      },
      {
        title: "Flechazo",
        body: "Interés romántico: coincidid en la misma mesa en la próxima ronda y recibe sus datos de contacto.",
      },
    ],
    formatsEyebrow: "Formatos",
    formatsTitle: "Elige tu forma de conectar",
    formatsSubtitle: "Mismo espíritu, distintos sabores. Cada edición tiene un foco diferente.",
    formats: [
      {
        tag: "Lúdico",
        title: "Probar juegos",
        body: "Editoriales y autores muestran sus juegos. Los pruebas durante la rotación, en vivo.",
      },
      {
        tag: "Amistades",
        title: "Conocer gente",
        body: "Orientado a hacer nuevas amistades reales jugando, sin presión.",
      },
      {
        tag: "Romántico",
        title: "Conexiones románticas",
        body: "Conoce a alguien especial mientras juegas. Sin postureo, con propósito.",
      },
      {
        tag: "Retrogaming",
        title: "Conexión + retro",
        body: "Combinamos juegos de mesa con retrogaming. La nostalgia que rompe el hielo.",
      },
    ],
    venuesEyebrow: "Sedes",
    venuesTitle: "Dónde pasa",
    venuesSubtitle: "Dos espacios con personalidad propia en Barcelona.",
    venues: [
      {
        name: "L'Estació · Espai Gastronòmic",
        tag: "Dentro de la Noche de Juegos",
        body: "Dentro de la noche de juegos regular damos espacio a que se creen conexiones reales en un entorno único.",
      },
      {
        name: "Hugo's Diner",
        tag: "Sede principal",
        body: "Sede principal de Slow Friending Lúdico: amistades & lo que surja jugando a juegos de mesa y retrogaming.",
      },
    ],
    finalTitle: "¿Te apuntas a la próxima edición?",
    finalBody: "Plazas limitadas. Encuentra la fecha que mejor te encaje en nuestro Meetup.",
  },
  en: {
    eyebrow: "Slow Friending Lúdico",
    title: "More than games — real connections",
    intro:
      "Meet new people in Barcelona while playing board games. Rotating tables, real conversations and our own platform (KONEKTUM) so nothing gets lost when the night ends.",
    ctaQuestion: "Just moved to Barcelona? Looking to grow your circle of friends or meet someone special? Want to try new board games?",
    bullets: [
      "Tables matched by age range",
      "Mixed genders, respectful dynamic",
      "Easy games, short rounds",
      "Our own app for real follow-ups",
    ],
    ctaYes: "If the answer is YES, this activity is for you.",
    ctaJoin: "Sign up for the next event",
    howEyebrow: "How it works",
    howTitle: "Four steps, one experience",
    howSubtitle: "Similar to speed dating: tables and players rotate each round (~35 min) and you mark affinity with the people you met.",
    steps: [
      {
        title: "You sign up",
        body: "You receive your access code to KONEKTUM, our platform that runs the whole experience.",
      },
      {
        title: "We assign you a table",
        body: "People in your same age range and mixed genders, ready to play.",
      },
      {
        title: "Play, connect, rotate",
        body: "~35-minute rounds. Each round, new tablemates and new games.",
      },
      {
        title: "Open KONEKTUM",
        body: "From your panel you see your tables, mark affinities (friendship or romance) and use the extra features.",
      },
    ],
    extrasEyebrow: "Extra features",
    extras: [
      {
        title: "Repeat",
        body: "Ask to share a table again in a future round. The other person needs to approve.",
      },
      {
        title: "Super Like",
        body: "Let someone know there was real interest in getting to know them more.",
      },
      {
        title: "Flechazo",
        body: "Romantic interest: share a table in the next round and receive their contact details.",
      },
    ],
    formatsEyebrow: "Formats",
    formatsTitle: "Pick your way to connect",
    formatsSubtitle: "Same spirit, different flavours. Each edition has a focus.",
    formats: [
      {
        tag: "Lúdico",
        title: "Try new games",
        body: "Publishers and designers showcase their games. You try them live during the rotation.",
      },
      {
        tag: "Friendship",
        title: "Meet people",
        body: "Focused on making real new friends while playing — zero pressure.",
      },
      {
        tag: "Romantic",
        title: "Romantic connections",
        body: "Meet someone special while playing. No posing, just purpose.",
      },
      {
        tag: "Retrogaming",
        title: "Connect + retro",
        body: "Board games meet retrogaming. The nostalgia that breaks the ice.",
      },
    ],
    venuesEyebrow: "Venues",
    venuesTitle: "Where it happens",
    venuesSubtitle: "Two spaces with their own personality in Barcelona.",
    venues: [
      {
        name: "L'Estació · Espai Gastronòmic",
        tag: "Inside Game Night",
        body: "Within the regular Game Night we make room for real connections in a one-of-a-kind venue.",
      },
      {
        name: "Hugo's Diner",
        tag: "Main venue",
        body: "Main venue for Slow Friending Lúdico: friendship & whatever comes up, playing board games and retrogaming.",
      },
    ],
    finalTitle: "Ready for the next edition?",
    finalBody: "Limited seats. Find the date that fits you best on our Meetup.",
  },
  ca: {
    eyebrow: "Slow Friending Lúdic",
    title: "Més que jocs, són connexions",
    intro:
      "Coneix gent nova a Barcelona jugant a jocs de taula. Rotació de taules, converses reals i una plataforma pròpia (KONEKTUM) perquè res no es perdi quan acabi la nit.",
    ctaQuestion: "Acabes d'arribar a Barcelona? Vols ampliar el teu cercle d'amistats o conèixer algú especial? Vols provar jocs nous?",
    bullets: [
      "Taules amb persones de la teva franja d'edat",
      "Gèneres barrejats, dinàmica respectuosa",
      "Jocs fàcils, partides curtes",
      "App pròpia per a connexions reals",
    ],
    ctaYes: "Si la resposta és SÍ, aquesta activitat és per a tu.",
    ctaJoin: "Apunta't al pròxim esdeveniment",
    howEyebrow: "Com funciona",
    howTitle: "Quatre passos, una experiència",
    howSubtitle: "Dinàmica similar a un speed dating: rotació de taules i participants a cada ronda (~35 min) i selecció d'afinitat amb qui has coincidit.",
    steps: [
      {
        title: "T'inscrius a l'esdeveniment",
        body: "Reps el teu codi d'accés a KONEKTUM, la nostra plataforma que ho gestiona tot.",
      },
      {
        title: "T'assignem una taula",
        body: "Persones de la teva mateixa franja d'edat i gèneres diferents, llestes per jugar.",
      },
      {
        title: "Jugues, connectes i rotes",
        body: "Rondes d'uns 35 minuts. A cada ronda, nous companys de taula i nous jocs.",
      },
      {
        title: "Entres a KONEKTUM",
        body: "Des del teu panell veus les taules, marques afinitats (amistat o romanç) i fas servir les funcions extra.",
      },
    ],
    extrasEyebrow: "Funcionalitats extra",
    extras: [
      {
        title: "Repetir",
        body: "Demana tornar a coincidir amb algú en una taula futura. Cal l'aprovació de l'altra persona.",
      },
      {
        title: "Super Like",
        body: "Fes saber a algú que hi ha hagut un interès real per continuar coneixent-vos.",
      },
      {
        title: "Flechazo",
        body: "Interès romàntic: coincidiu a la mateixa taula a la pròxima ronda i en reps les dades de contacte.",
      },
    ],
    formatsEyebrow: "Formats",
    formatsTitle: "Tria la teva manera de connectar",
    formatsSubtitle: "Mateix esperit, sabors diferents. Cada edició té un focus.",
    formats: [
      {
        tag: "Lúdic",
        title: "Provar jocs",
        body: "Editorials i autors mostren els seus jocs. Els proves en directe durant la rotació.",
      },
      {
        tag: "Amistats",
        title: "Conèixer gent",
        body: "Orientat a fer noves amistats reals jugant, sense pressió.",
      },
      {
        tag: "Romàntic",
        title: "Connexions romàntiques",
        body: "Coneix algú especial mentre jugues. Sense posats, amb propòsit.",
      },
      {
        tag: "Retrogaming",
        title: "Connexió + retro",
        body: "Combinem jocs de taula amb retrogaming. La nostàlgia que trenca el gel.",
      },
    ],
    venuesEyebrow: "Seus",
    venuesTitle: "On passa",
    venuesSubtitle: "Dos espais amb personalitat pròpia a Barcelona.",
    venues: [
      {
        name: "L'Estació · Espai Gastronòmic",
        tag: "Dins la Nit de Jocs",
        body: "Dins la nit de jocs regular obrim espai perquè es creïn connexions reals en un entorn únic.",
      },
      {
        name: "Hugo's Diner",
        tag: "Seu principal",
        body: "Seu principal de Slow Friending Lúdic: amistats & el que surti jugant a jocs de taula i retrogaming.",
      },
    ],
    finalTitle: "T'apuntes a la pròxima edició?",
    finalBody: "Places limitades. Troba la data que millor t'encaixi al nostre Meetup.",
  },
};

const stepIcons = [Smartphone, Users, Timer, Heart];
const extraIcons = [Repeat, Star, Zap];
const formatIcons = [Dices, HeartHandshake, Heart, Gamepad2];

export function SlowFriendingPage() {
  const { locale } = useI18n();
  const l = (locale as Locale) in copy ? (locale as Locale) : "es";
  const c = copy[l];
  const [activeStep, setActiveStep] = useState(0);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-hidden border-b-2 border-ink/10">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-12 right-[6%] size-72 rounded-full bg-coral/25 blur-3xl" />
          <div className="absolute bottom-0 left-[8%] size-80 rounded-full bg-coral-deep/15 blur-3xl" />
          <div className="absolute top-32 left-[6%] text-6xl rotate-[-12deg] opacity-70 select-none">💌</div>
          <div className="absolute bottom-24 right-[10%] text-6xl rotate-[10deg] opacity-70 select-none">🎲</div>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-coral text-cream border-2 border-ink px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tactile-sm">
              <Sparkles className="h-3.5 w-3.5" /> {c.eyebrow}
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[0.98] tracking-tight">
              {c.title}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-foreground/75 leading-relaxed max-w-2xl">
              {c.intro}
            </p>
            <div className="mt-8 bg-card border-2 border-ink rounded-3xl p-6 shadow-tactile">
              <p className="text-base sm:text-lg font-medium leading-relaxed">{c.ctaQuestion}</p>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 inline-block size-2 rounded-full bg-coral flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-base font-bold text-coral-deep">{c.ctaYes}</p>
              <a
                href={MEETUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-coral text-cream border-2 border-ink px-5 py-3 text-sm font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <CalendarDays className="h-4 w-4" /> {c.ctaJoin}
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 rounded-3xl bg-coral/20 rotate-3" aria-hidden />
              <div className="relative bg-cream border-2 border-ink rounded-3xl p-6 shadow-tactile-lg">
                <img
                  src={getOptimizedImageUrl(logoAsset.url, { width: 768, resize: "contain" })}
                  alt="Slow Friending Lúdico"
                  className="w-full h-auto"
                  width={384}
                  height={384}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              {c.howEyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-semibold leading-tight">{c.howTitle}</h2>
            <p className="mt-4 text-lg text-foreground/70">{c.howSubtitle}</p>
          </div>

          {/* Step picker */}
          <div className="mt-12 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-3">
              {c.steps.map((s, i) => {
                const Icon = stepIcons[i];
                const active = activeStep === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setActiveStep(i)}
                    onClick={() => setActiveStep(i)}
                    className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                      active
                        ? "border-ink bg-coral text-cream shadow-tactile -translate-x-[2px] -translate-y-[2px]"
                        : "border-ink/20 bg-card hover:border-ink"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 size-12 rounded-2xl border-2 border-ink flex items-center justify-center font-display font-bold text-lg ${
                        active ? "bg-cream text-ink" : "bg-coral text-cream"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-base font-display font-semibold">
                        <Icon className="h-4 w-4" /> {s.title}
                      </span>
                      <span className={`mt-1 block text-sm ${active ? "text-cream/90" : "text-foreground/70"}`}>
                        {s.body}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="lg:col-span-7">
              <div className="relative bg-ink text-cream border-2 border-ink rounded-3xl p-8 shadow-tactile-lg min-h-[360px] overflow-hidden">
                <div className="absolute -top-16 -right-16 size-64 rounded-full bg-coral/25 blur-3xl pointer-events-none" />
                <div className="relative">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-coral text-cream px-3 py-1 rounded-full border-2 border-cream/30">
                    {l === "en" ? "Step" : l === "ca" ? "Pas" : "Paso"} {activeStep + 1} / {c.steps.length}
                  </span>
                  <h3 className="mt-5 text-3xl sm:text-4xl font-display font-semibold leading-tight">
                    {c.steps[activeStep].title}
                  </h3>
                  <p className="mt-4 text-lg text-cream/85 leading-relaxed">{c.steps[activeStep].body}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    {c.steps.map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          i === activeStep ? "w-10 bg-coral" : "w-2 bg-cream/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Extras */}
          <div className="mt-16">
            <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-6">
              {c.extrasEyebrow}
            </span>
            <div className="grid md:grid-cols-3 gap-6">
              {c.extras.map((e, i) => {
                const Icon = extraIcons[i];
                return (
                  <article
                    key={e.title}
                    className="group bg-card border-2 border-ink rounded-3xl p-6 shadow-tactile-sm hover:shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
                  >
                    <div className="size-12 rounded-2xl bg-coral text-cream border-2 border-ink flex items-center justify-center shadow-tactile-sm group-hover:rotate-6 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-display font-semibold">{e.title}</h3>
                    <p className="mt-2 text-sm text-foreground/75 leading-relaxed">{e.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FORMATS */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              {c.formatsEyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-semibold leading-tight">{c.formatsTitle}</h2>
            <p className="mt-4 text-lg text-foreground/70">{c.formatsSubtitle}</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.formats.map((f, i) => {
              const Icon = formatIcons[i];
              const dark = i % 2 === 1;
              return (
                <article
                  key={f.tag}
                  className={`relative rounded-3xl border-2 border-ink p-6 shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-tactile-lg transition-all overflow-hidden ${
                    dark ? "bg-ink text-cream" : "bg-card"
                  }`}
                >
                  <div className={`size-12 rounded-2xl border-2 border-ink flex items-center justify-center ${dark ? "bg-coral text-cream" : "bg-cream-deep text-coral-deep"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`mt-4 inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border-2 ${dark ? "border-cream/30 bg-cream/10 text-cream" : "border-ink bg-coral text-cream"}`}>
                    {f.tag}
                  </span>
                  <h3 className="mt-3 text-xl font-display font-semibold leading-tight">{f.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-cream/85" : "text-foreground/75"}`}>{f.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* VENUES */}
      <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              {c.venuesEyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-semibold leading-tight">{c.venuesTitle}</h2>
            <p className="mt-4 text-lg text-foreground/70">{c.venuesSubtitle}</p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            {c.venues.map((v, i) => (
              <article
                key={v.name}
                className="group bg-card border-2 border-ink rounded-3xl overflow-hidden shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-tactile-lg transition-all"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-ink">
                  <img
                    src={getOptimizedImageUrl(i === 0 ? estacioAsset.url : hugosAsset.url, { width: 800, height: 500 })}
                    srcSet={getResponsiveImageSrcSet(i === 0 ? estacioAsset.url : hugosAsset.url, [480, 800, 1200], { height: 500 })}
                    sizes="(min-width: 768px) 45vw, 100vw"
                    alt={v.name}
                    width={800}
                    height={500}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-coral text-cream border-2 border-ink rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-tactile-sm">
                    <MapPin className="h-3 w-3" /> {v.tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-display font-semibold leading-tight">{v.name}</h3>
                  <p className="mt-3 text-base text-foreground/75 leading-relaxed">{v.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-80 rounded-full bg-coral/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <img loading="lazy" decoding="async"
            src={getOptimizedImageUrl(logoAsset.url, { width: 448, resize: "contain" })}
            alt=""
            aria-hidden
            width={224}
            height={112}
            className="mx-auto h-28 w-auto opacity-90 [filter:brightness(0)_invert(1)]"
          />
          <h2 className="mt-6 text-4xl sm:text-5xl font-display font-semibold leading-tight">{c.finalTitle}</h2>
          <p className="mt-4 text-lg text-cream/80">{c.finalBody}</p>
          <a
            href={MEETUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-coral text-cream border-2 border-cream px-7 py-4 text-base font-bold shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all"
          >
            <CalendarDays className="h-5 w-5" /> {c.ctaJoin} <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </SiteLayout>
  );
}
