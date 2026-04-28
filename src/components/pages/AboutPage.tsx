import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Globe2, Sparkles, Dice5, ExternalLink } from "lucide-react";
import venueImg from "@/assets/about-venue.jpg";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { HistoryTimeline } from "@/components/about/HistoryTimeline";
import { EditableText, EditableImage } from "@/editor/Editable";

type TeamMember = {
  name: string;
  role: { es: string; en: string; ca: string };
  bio: { es: string; en: string; ca: string };
  favoriteGame: string;
  color: { es: string; en: string; ca: string };
  luckyNumber: string;
  photo?: string;
  emoji: string;
};

const TEAM: TeamMember[] = [
  {
    name: "Pau",
    role: { es: "Fundador & Estrategia", en: "Founder & Strategy", ca: "Fundador & Estratègia" },
    bio: {
      es: "Responsable de buscar colaboraciones y crear nuevos eventos. Toma las decisiones estratégicas. De día abogado de startups; de noche, una buena peli con pizza margherita.",
      en: "In charge of partnerships and new events. Makes strategic decisions. Lawyer for startups by day; movies and margherita pizza by night.",
      ca: "Responsable de col·laboracions i nous esdeveniments. Pren les decisions estratègiques. De dia advocat de startups; de nit, una bona pel·li amb pizza margherita.",
    },
    favoriteGame: "King of Tokyo",
    color: { es: "Azul", en: "Blue", ca: "Blau" },
    luckyNumber: "7",
    emoji: "🎲",
    photo: "https://kleff.es/wp-content/uploads/2025/08/Pau_kleff-225x300.jpg",
  },
  {
    name: "Pol",
    role: { es: "Arquitecto de juegos", en: "Game Architect", ca: "Arquitecte de jocs" },
    bio: {
      es: "Mantiene el orden en la colección de juegos de KLEFF. Se describe como arquitecto de juegos, colaborando con autores y editores para perfeccionar reglas.",
      en: "Keeps order in KLEFF's game collection. Self-described as a game architect, collaborating with designers and publishers to refine rules.",
      ca: "Manté l'ordre en la col·lecció de jocs. Es descriu com arquitecte de jocs, col·laborant amb autors i editors per perfeccionar regles.",
    },
    favoriteGame: "Splendor",
    color: { es: "Azul", en: "Blue", ca: "Blau" },
    luckyNumber: "7",
    emoji: "🏗️",
    photo: "https://kleff.es/wp-content/uploads/2025/08/Pol_kleff-225x300.jpg",
  },
  {
    name: "Beatriz",
    role: { es: "Eventos & retos", en: "Events & challenges", ca: "Esdeveniments & reptes" },
    bio: {
      es: "Apoya en la organización de eventos. Maestra de educación infantil con corazón de jugona. Le encanta diseñar retos, enseñar jugando y vivir aventuras.",
      en: "Supports event organization. Early-years teacher with a gamer's heart. Loves designing challenges, teaching through play and new adventures.",
      ca: "Dona suport a l'organització d'esdeveniments. Mestra d'educació infantil amb cor de jugona. Li encanta dissenyar reptes i ensenyar jugant.",
    },
    favoriteGame: "Stone Age",
    color: { es: "Me gusta variar", en: "Likes to mix it up", ca: "M'agrada variar" },
    luckyNumber: "2",
    emoji: "🎯",
    photo: "https://kleff.es/wp-content/uploads/2025/09/Beatriz-225x300.jpg",
  },
  {
    name: "Jordi",
    role: { es: "Equipo KLEFF", en: "KLEFF crew", ca: "Equip KLEFF" },
    bio: {
      es: "Próximamente. Estamos preparando su ficha completa.",
      en: "Coming soon. We're putting together their full profile.",
      ca: "Pròximament. Estem preparant la seva fitxa completa.",
    },
    favoriteGame: "—",
    color: { es: "—", en: "—", ca: "—" },
    luckyNumber: "—",
    emoji: "🎮",
    photo: "https://kleff.es/wp-content/uploads/2025/09/Jordi-225x300.jpg",
  },
  {
    name: "Karen",
    role: { es: "Equipo KLEFF", en: "KLEFF crew", ca: "Equip KLEFF" },
    bio: {
      es: "Próximamente. Estamos preparando su ficha completa.",
      en: "Coming soon. We're putting together their full profile.",
      ca: "Pròximament. Estem preparant la seva fitxa completa.",
    },
    favoriteGame: "—",
    color: { es: "—", en: "—", ca: "—" },
    luckyNumber: "—",
    emoji: "✨",
    photo: "https://kleff.es/wp-content/uploads/2025/09/Karen-225x300.jpg",
  },
  {
    name: "Leiro",
    role: { es: "Equipo KLEFF", en: "KLEFF crew", ca: "Equip KLEFF" },
    bio: {
      es: "Próximamente. Estamos preparando su ficha completa.",
      en: "Coming soon. We're putting together their full profile.",
      ca: "Pròximament. Estem preparant la seva fitxa completa.",
    },
    favoriteGame: "—",
    color: { es: "—", en: "—", ca: "—" },
    luckyNumber: "—",
    emoji: "🃏",
    photo: "https://kleff.es/wp-content/uploads/2025/09/Leiro-225x300.jpg",
  },
  {
    name: "Eric",
    role: { es: "Equipo KLEFF", en: "KLEFF crew", ca: "Equip KLEFF" },
    bio: {
      es: "Próximamente. Estamos preparando su ficha completa.",
      en: "Coming soon. We're putting together their full profile.",
      ca: "Pròximament. Estem preparant la seva fitxa completa.",
    },
    favoriteGame: "—",
    color: { es: "—", en: "—", ca: "—" },
    luckyNumber: "—",
    emoji: "🎲",
    photo: "https://kleff.es/wp-content/uploads/2025/09/Eric-225x300.jpg",
  },
];

export function AboutPage() {
  const { t, locale, href } = useI18n();

  const manifestoLine1 =
    locale === "en"
      ? "We started playing so we wouldn't be alone."
      : locale === "ca"
        ? "Vam començar a jugar per no estar sols."
        : "Empezamos a jugar para no estar solos.";
  const manifestoLine2 =
    locale === "en"
      ? "We keep playing so no one else has to."
      : locale === "ca"
        ? "Seguim jugant perquè ningú més ho hagi d'estar."
        : "Seguimos jugando para que nadie más lo esté.";

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-x-clip border-b-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 stamp-coral text-xs font-bold uppercase tracking-widest mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              <EditableText id="about.hero.eyebrow" as="span">{t.about.eyebrow}</EditableText>
            </span>
            <EditableText id="about.hero.title" as="h1" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[1.02] tracking-normal text-foreground break-words">
              {locale === "en"
                ? "Born in Barcelona, fueled by board games."
                : locale === "ca"
                  ? "Nascuts a Barcelona, mouts pels jocs de taula."
                  : "Nacidos en Barcelona, movidos por los juegos de mesa."}
            </EditableText>
            <EditableText id="about.hero.intro" as="p" className="mt-6 text-lg sm:text-xl text-foreground/75 max-w-2xl leading-relaxed">
              {t.about.intro}
            </EditableText>
          </div>
          <div className="lg:col-span-5">
            <div className="relative bg-card border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden aspect-[4/3]">
              <EditableImage
                id="about.hero.image"
                src={venueImg}
                alt="L'Estació de França — sede de KLEFF"
                width={1600}
                height={1200}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 bg-cream border-2 border-ink rounded-2xl px-3 py-2 shadow-tactile-sm">
                <Calendar className="h-4 w-4 text-coral" />
                <span className="text-sm font-bold">
                  {locale === "en" ? "Since 2019" : locale === "ca" ? "Des de 2019" : "Desde 2019"}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 bg-cream border-2 border-ink rounded-2xl px-3 py-2 shadow-tactile-sm">
                <Dice5 className="h-4 w-4 text-coral" />
                <span className="text-sm font-bold">+500 {locale === "en" ? "games" : locale === "ca" ? "jocs" : "juegos"}</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-cream border-2 border-ink rounded-2xl px-3 py-2 shadow-tactile-sm">
                <Globe2 className="h-4 w-4 text-coral" />
                <span className="text-sm font-bold">ES · CAT · EN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-20 md:py-24 bg-ink text-cream relative overflow-hidden">
        <div className="absolute top-10 left-10 size-16 bg-coral border-4 border-cream/20 rounded-2xl hidden md:block" />
        <div className="absolute bottom-10 right-20 size-20 bg-coral/40 border-4 border-cream/20 rounded-full hidden md:block" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          <EditableText id="about.mission.eyebrow" as="span" className="inline-block bg-coral text-cream px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
            {locale === "en" ? "Mission" : locale === "ca" ? "Missió" : "Misión"}
          </EditableText>
          <EditableText id="about.mission.title" as="h2" className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-cream leading-tight">
            {locale === "en"
              ? "A meeting point for young people from anywhere in the world."
              : locale === "ca"
                ? "Un punt de trobada per a joves d'arreu del món."
                : "Un punto de encuentro para jóvenes de todo el mundo."}
          </EditableText>
          <EditableText id="about.mission.body" as="p" className="mt-8 text-lg sm:text-xl text-cream/85 max-w-3xl leading-relaxed">
            {locale === "en"
              ? "It doesn't matter where you're from or how old you are. The only thing needed to be a #kleffer is wanting to make new friends and learn new ways to have fun. Board games are the perfect excuse we use to connect people and break the ice."
              : locale === "ca"
                ? "No importa d'on vinguis ni quants anys tinguis. L'únic necessari per ser un #kleffer és voler fer nous amics i aprendre noves formes de divertir-se. Els jocs de taula són l'excusa perfecta per connectar persones i trencar el gel."
                : "No importa de dónde vengas ni cuántos años tengas. Lo único necesario para ser un #kleffer es querer hacer nuevos amigos y aprender nuevas formas de divertirse. Los juegos de mesa son la excusa perfecta que usamos para conectar a las personas y romper el hielo."}
          </EditableText>
          <EditableText id="about.mission.cta" as="p" className="mt-6 text-lg font-display font-semibold text-coral">
            {locale === "en"
              ? "Dare to be part of our community?"
              : locale === "ca"
                ? "T'atreveixes a formar part de la nostra comunitat?"
                : "¿Te atreves a ser parte de nuestra comunidad?"}
          </EditableText>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-20 md:py-28 bg-cream-deep/40 border-b-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              {locale === "en" ? "The thread" : locale === "ca" ? "El fil" : "El hilo"}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-[1.05]">
              {locale === "en" ? (
                <>De 2018 a <span className="marker-coral">hoy</span>, hito a hito.</>
              ) : locale === "ca" ? (
                <>De 2018 a <span className="marker-coral">avui</span>, fita a fita.</>
              ) : (
                <>De 2018 a <span className="marker-coral">hoy</span>, hito a hito.</>
              )}
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              {locale === "en"
                ? "Follow the numbers to walk through KLEFF's story →"
                : locale === "ca"
                  ? "Segueix els números per recórrer la història de KLEFF →"
                  : "Sigue los números para recorrer la historia de KLEFF →"}
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-10 px-4 sm:px-6 lg:px-8">
          <HistoryTimeline locale={locale} />
        </div>
      </section>

      {/* TEAM — Flip cards */}
      <section className="py-20 md:py-28 bg-cream border-b-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              #TeamKLEFF
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
              {t.about.teamTitle}
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              {t.about.teamSubtitle}{" "}
              <span className="hidden md:inline text-foreground/55">
                ({locale === "en" ? "hover or tap to flip" : locale === "ca" ? "passa-hi o toca per girar" : "pasa el ratón o toca para voltear"})
              </span>
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {TEAM.map((m) => (
              <TeamFlipCard key={m.name} member={m} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO — what drives us */}
      <section className="relative py-24 md:py-32 bg-coral text-cream overflow-hidden">
        <div className="absolute -top-12 left-4 sm:left-12 text-[14rem] sm:text-[20rem] font-display leading-none text-cream/15 select-none pointer-events-none">
          “
        </div>
        <div className="absolute -bottom-32 right-4 sm:right-12 text-[14rem] sm:text-[20rem] font-display leading-none text-cream/15 select-none pointer-events-none rotate-180">
          “
        </div>
        <div className="absolute top-12 right-10 size-16 bg-cream/10 border-2 border-cream/30 rounded-2xl rotate-12 hidden md:block animate-wiggle" />
        <div className="absolute bottom-16 left-16 size-12 bg-cream/10 border-2 border-cream/30 rounded-full hidden md:block animate-wiggle" style={{ animationDelay: "1s" }} />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <EditableText id="about.manifesto.eyebrow" as="span" className="inline-block bg-cream text-coral-deep px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] mb-8 border-2 border-ink shadow-tactile-sm">
            {locale === "en" ? "What drives us" : locale === "ca" ? "El que ens mou" : "Lo que nos mueve"}
          </EditableText>
          <blockquote className="font-display font-semibold text-3xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-cream">
            <EditableText id="about.manifesto.line1" as="span">
              {manifestoLine1}
            </EditableText>
            <br />
            <EditableText id="about.manifesto.line2" as="span" className="italic text-cream">
              {manifestoLine2}
            </EditableText>
          </blockquote>
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="w-10 h-px bg-cream" />
            <EditableText id="about.manifesto.author" as="span" className="text-xs font-bold tracking-[0.3em] text-cream/85">
              {locale === "en"
                ? "PAU · KLEFF FOUNDER"
                : locale === "ca"
                  ? "PAU · FUNDADOR DE KLEFF"
                  : "PAU · FUNDADOR DE KLEFF"}
            </EditableText>
            <div className="w-10 h-px bg-cream" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 bg-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative bg-cream border-4 border-ink rounded-[2.5rem] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-tactile-lg">
            <Calendar className="h-10 w-10 text-coral mx-auto" />
            <EditableText id="about.cta.title" as="h2" className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-foreground">
              {locale === "en"
                ? "Want to be part of what comes next?"
                : locale === "ca"
                  ? "Vols formar part del que vindrà?"
                  : "¿Quieres formar parte de lo que viene?"}
            </EditableText>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-coral text-cream border-2 border-ink px-6 py-3.5 text-sm font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                {locale === "en" ? "See upcoming events" : locale === "ca" ? "Veure pròxims esdeveniments" : "Ver próximos eventos"}
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                to={href("/contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink text-cream border-2 border-ink px-6 py-3.5 text-sm font-bold hover:bg-foreground transition-colors"
              >
                {t.nav.contact}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

/* === SUB-COMPONENTS === */

function TeamFlipCard({
  member,
  locale,
}: {
  member: TeamMember;
  locale: "es" | "en" | "ca";
}) {
  return (
    <div className="flip-card aspect-[3/4] rounded-3xl">
      <div className="flip-card-inner">
        {/* FRONT */}
        <div className="flip-card-face bg-card border-2 border-ink shadow-tactile-sm rounded-3xl flex flex-col">
          <div className="relative flex-1 bg-gradient-to-br from-coral/20 via-cream-deep/50 to-coral/30 overflow-hidden">
            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl">
                {member.emoji}
              </div>
            )}
            <div className="absolute top-3 right-3 size-10 bg-cream border-2 border-ink rounded-full flex items-center justify-center text-xl shadow-tactile-sm">
              {member.emoji}
            </div>
          </div>
          <div className="p-4 border-t-2 border-ink bg-cream">
            <div className="text-xl font-display font-bold text-foreground">{member.name}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-coral-deep mt-0.5">
              {member.role[locale]}
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-card-back flip-card-face bg-ink text-cream border-2 border-ink shadow-tactile-sm rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-display font-bold text-cream">{member.name}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-coral mt-0.5">
                {member.role[locale]}
              </div>
            </div>
            <div className="size-10 bg-coral border-2 border-cream rounded-full flex items-center justify-center text-lg">
              {member.emoji}
            </div>
          </div>
          <p className="mt-4 text-sm text-cream/85 leading-relaxed flex-1 line-clamp-6">
            {member.bio[locale]}
          </p>
          <dl className="mt-4 pt-4 border-t border-cream/15 space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-cream/60 uppercase tracking-wider font-bold">
                {locale === "en" ? "Fav game" : locale === "ca" ? "Joc preferit" : "Juego fav."}
              </dt>
              <dd className="text-cream font-display font-semibold text-right">{member.favoriteGame}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-cream/60 uppercase tracking-wider font-bold">
                {locale === "en" ? "Color" : "Color"}
              </dt>
              <dd className="text-cream font-display font-semibold text-right">{member.color[locale]}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-cream/60 uppercase tracking-wider font-bold">
                {locale === "en" ? "Lucky #" : locale === "ca" ? "Núm. sort" : "Núm. suerte"}
              </dt>
              <dd className="text-cream font-display font-semibold text-right tabular-nums">{member.luckyNumber}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
