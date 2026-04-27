import { Link, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  Globe2,
  Smile,
  ArrowRight,
  Calendar,
  Newspaper,
  Users,
  Sparkles,
  Dice5,
  Trophy,
  Building2,
  Store,
  BookOpen,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import venueImg from "@/assets/about-venue.jpg";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PRESS_LINKS } from "@/data/press";
import type { OgPreview } from "@/server/og.functions";

/* =========================
 * STATIC DATA
 * ========================= */

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
    role: {
      es: "Fundador & Estrategia",
      en: "Founder & Strategy",
      ca: "Fundador & Estratègia",
    },
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
    role: {
      es: "Arquitecto de juegos",
      en: "Game Architect",
      ca: "Arquitecte de jocs",
    },
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
    role: {
      es: "Eventos & retos",
      en: "Events & challenges",
      ca: "Esdeveniments & reptes",
    },
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

const COMMUNITIES = [
  {
    name: "Blood on the Clocktower",
    icon: "🕰️",
    blurb: {
      es: "El juego de roles ocultos mejor valorado en BGG. Mínimo 2 partidas semanales.",
      en: "The top-rated hidden roles game on BGG. At least 2 games every week.",
      ca: "El joc de rols ocults millor valorat a BGG. Mínim 2 partides setmanals.",
    },
  },
  {
    name: "Catan",
    icon: "🏝️",
    blurb: {
      es: "El precursor de los juegos modernos. Torneos y actividades recurrentes.",
      en: "The precursor to modern board games. Recurring tournaments and events.",
      ca: "El precursor dels jocs moderns. Tornejos i activitats recurrents.",
    },
  },
  {
    name: "Unmatched",
    icon: "⚔️",
    blurb: {
      es: "El juego de enfrentamientos más popular del momento. Torneos frecuentes.",
      en: "The most popular skirmish game right now. Frequent tournaments.",
      ca: "El joc d'enfrontaments més popular del moment. Tornejos freqüents.",
    },
  },
  {
    name: "Roles Ocultos",
    icon: "🎭",
    blurb: {
      es: "Comunidad para descubrir juegos de deducción social e identidades secretas.",
      en: "A community for social deduction games and secret identity titles.",
      ca: "Comunitat per descobrir jocs de deducció social i identitats secretes.",
    },
  },
];

const PARTNERS = {
  associations: [
    "Espai de Joc 0-99",
    "BNGrup",
    "Espai de Jocs Sant Andreu",
    "Movistar Center",
    "CNL",
    "Checkpoint Gaming",
    "Casa Sagnier",
  ],
  shops: ["Mathom", "The Curiosity Shop", "Gameria", "Kaburi"],
  publishers: [
    "DEVIR",
    "Maldito Games",
    "GDM Games",
    "Zombi Paella",
    "Magic Box Games",
    "Mercurio",
    "Bumble3ee",
    "Key Enigma",
    "Toysline",
    "2 Tomatoes",
    "Brainpicnic",
    "Asmodee",
  ],
};

/* =========================
 * COMPONENT
 * ========================= */

function usePressPreviews(): OgPreview[] {
  const data = useRouterState({
    select: (s) => {
      for (const m of s.matches) {
        const ld: any = m.loaderData;
        if (ld && Array.isArray(ld) && ld[0] && "url" in ld[0]) {
          return ld as OgPreview[];
        }
      }
      return null;
    },
  });
  return data ?? [];
}

export function AboutPage() {
  const { t, locale, href } = useI18n();
  const previews = usePressPreviews();
  const previewByUrl = new Map(previews.map((p) => [p.url, p]));

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-x-clip border-b-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 stamp-coral text-xs font-bold uppercase tracking-widest mb-5">
              <Sparkles className="h-3.5 w-3.5" /> {t.about.eyebrow}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[1.02] tracking-normal text-foreground break-words">
              {locale === "en" ? (
                <>
                  Born in <span className="marker-coral">Barcelona</span>, fueled by board games.
                </>
              ) : locale === "ca" ? (
                <>
                  Nascuts a <span className="marker-coral">Barcelona</span>, mouts pels jocs de taula.
                </>
              ) : (
                <>
                  Nacidos en <span className="marker-coral">Barcelona</span>, movidos por los juegos de mesa.
                </>
              )}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-foreground/75 max-w-2xl leading-relaxed">
              {t.about.intro}
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="relative bg-card border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden aspect-[4/3]">
              <img
                src={venueImg}
                alt="L'Estació de França — sede de KLEFF"
                width={1600}
                height={1200}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            {/* Quick fact stickers */}
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

      {/* STORY */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
            {locale === "en" ? "About us" : locale === "ca" ? "Sobre nosaltres" : "Sobre nosotros"}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
            {t.about.storyTitle}
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-8">
            <div className="bg-card border-2 border-ink rounded-3xl p-7 shadow-tactile-sm">
              <p className="text-lg leading-relaxed text-foreground/85">
                {locale === "en"
                  ? "KLEFF was born in October 2019. Pau and his partner, after a year of meeting weekly to play board games, decided it was time to build a community around their hobby."
                  : locale === "ca"
                    ? "KLEFF va néixer l'octubre de 2019. En Pau i el seu soci, després de passar l'any anterior trobant-se setmanalment per jugar a jocs de taula, van decidir que era el moment de crear una comunitat."
                    : "KLEFF nació en octubre de 2019. Pau y su socio, después de pasar el año anterior reuniéndose semanalmente para jugar a juegos de mesa, decidieron que era el momento de crear una comunidad."}
              </p>
            </div>
            <div className="bg-card border-2 border-ink rounded-3xl p-7 shadow-tactile-sm">
              <p className="text-lg leading-relaxed text-foreground/85">
                {locale === "en"
                  ? "The #TeamKLEFF, born with two people, has always been an open community. In early 2025, KLEFF reinvented itself with more contributors and an exceptional venue."
                  : locale === "ca"
                    ? "El #TeamKLEFF, tot i néixer amb dos membres, sempre ha estat una comunitat oberta. A principis de 2025 KLEFF es va reinventar amb més col·laboradors i un lloc excepcional."
                    : "El #TeamKLEFF, aunque nació con dos miembros, siempre ha sido una comunidad abierta. A principios de 2025, KLEFF se reinventó, incorporando más colaboradores y un lugar excepcional."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-20 md:py-24 bg-ink text-cream relative overflow-hidden">
        <div className="absolute top-10 left-10 size-16 bg-coral border-4 border-cream/20 rounded-2xl hidden md:block" />
        <div className="absolute bottom-10 right-20 size-20 bg-coral/40 border-4 border-cream/20 rounded-full hidden md:block" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
          <span className="inline-block bg-coral text-cream px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
            {locale === "en" ? "Mission" : locale === "ca" ? "Missió" : "Misión"}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-cream leading-tight">
            {locale === "en"
              ? "A meeting point for young people from anywhere in the world."
              : locale === "ca"
                ? "Un punt de trobada per a joves d'arreu del món."
                : "Un punto de encuentro para jóvenes de todo el mundo."}
          </h2>
          <p className="mt-8 text-lg sm:text-xl text-cream/85 max-w-3xl leading-relaxed">
            {locale === "en"
              ? "It doesn't matter where you're from or how old you are. The only thing needed to be a #kleffer is wanting to make new friends and learn new ways to have fun. Board games are the perfect excuse we use to connect people and break the ice."
              : locale === "ca"
                ? "No importa d'on vinguis ni quants anys tinguis. L'únic necessari per ser un #kleffer és voler fer nous amics i aprendre noves formes de divertir-se. Els jocs de taula són l'excusa perfecta per connectar persones i trencar el gel."
                : "No importa de dónde vengas ni cuántos años tengas. Lo único necesario para ser un #kleffer es querer hacer nuevos amigos y aprender nuevas formas de divertirse. Los juegos de mesa son la excusa perfecta que usamos para conectar a las personas y romper el hielo."}
          </p>
          <p className="mt-6 text-lg font-display font-semibold text-coral">
            {locale === "en"
              ? "Dare to be part of our community?"
              : locale === "ca"
                ? "T'atreveixes a formar part de la nostra comunitat?"
                : "¿Te atreves a ser parte de nuestra comunidad?"}
          </p>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-display font-semibold text-foreground max-w-2xl">
            {t.about.valuesTitle}
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <ValueCard icon={<Heart className="h-6 w-6" />} title={t.about.value1Title} body={t.about.value1Body} />
            <ValueCard icon={<Globe2 className="h-6 w-6" />} title={t.about.value2Title} body={t.about.value2Body} />
            <ValueCard icon={<Smile className="h-6 w-6" />} title={t.about.value3Title} body={t.about.value3Body} />
          </div>
        </div>
      </section>

      {/* TEAM — Flip cards */}
      <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
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

      {/* COMMUNITIES */}
      <section className="py-20 md:py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              <Users className="h-3.5 w-3.5" />
              {locale === "en" ? "Communities" : locale === "ca" ? "Comunitats" : "Comunidades"}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
              {t.about.communitiesTitle}
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              {locale === "en"
                ? "Subgroups within KLEFF that meet around a specific game or genre."
                : locale === "ca"
                  ? "Subgrups dins de KLEFF que es reuneixen al voltant d'un joc o gènere concret."
                  : "Subgrupos dentro de KLEFF que se reúnen alrededor de un juego o género concreto."}
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMMUNITIES.map((c) => (
              <article
                key={c.name}
                className="group bg-card border-2 border-ink rounded-3xl p-6 shadow-tactile-sm hover:shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200"
              >
                <div className="size-14 rounded-2xl bg-coral/15 border-2 border-coral/40 flex items-center justify-center text-3xl">
                  {c.icon}
                </div>
                <h3 className="mt-5 text-xl font-display font-semibold text-foreground">{c.name}</h3>
                <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{c.blurb[locale]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS — three columns with icons */}
      <section className="py-20 md:py-24 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              <Trophy className="h-3.5 w-3.5" />
              {locale === "en" ? "Partners" : locale === "ca" ? "Col·laboradors" : "Colaboradores"}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
              {t.about.partnersTitle}
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              {locale === "en"
                ? "Organizations, shops and publishers that make KLEFF possible week after week."
                : locale === "ca"
                  ? "Organitzacions, botigues i editorials que fan possible KLEFF setmana rere setmana."
                  : "Organizaciones, tiendas y editoriales que hacen posible KLEFF semana tras semana."}
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <PartnerColumn
              icon={<Building2 className="h-5 w-5" />}
              title={t.about.partnersAssociations}
              items={PARTNERS.associations}
            />
            <PartnerColumn
              icon={<Store className="h-5 w-5" />}
              title={t.about.partnersShops}
              items={PARTNERS.shops}
            />
            <PartnerColumn
              icon={<BookOpen className="h-5 w-5" />}
              title={t.about.partnersPublishers}
              items={PARTNERS.publishers}
            />
          </div>
        </div>
      </section>

      {/* PRESS — newspaper aesthetic */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="newspaper-rule mx-auto max-w-md mb-4" />
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-foreground/60">
              <Newspaper className="h-3.5 w-3.5" />
              {locale === "en" ? "The KLEFF Times — Press" : locale === "ca" ? "The KLEFF Times — Premsa" : "The KLEFF Times — Prensa"}
            </span>
            <h2 className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-newspaper font-bold text-foreground tracking-tight">
              {t.about.pressTitle}
            </h2>
            <div className="newspaper-rule mx-auto max-w-md mt-4" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRESS_LINKS.map((link) => {
              const og = previewByUrl.get(link.url);
              const title = link.titleOverride ?? og?.title ?? link.outlet ?? link.url;
              const image = link.imageOverride ?? og?.image ?? null;
              const outlet = link.outlet ?? og?.siteName ?? new URL(link.url).hostname.replace("www.", "");
              const description = og?.description ?? null;
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-card border-2 border-ink rounded-2xl overflow-hidden shadow-tactile-sm hover:shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200"
                >
                  {/* Header strip — like a paper masthead */}
                  <div className="px-4 py-2 bg-ink text-cream flex items-center justify-between border-b-2 border-ink">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] truncate">
                      {outlet}
                    </span>
                    {link.date && (
                      <span className="text-[10px] font-mono tabular-nums text-cream/80 shrink-0">
                        {link.date}
                      </span>
                    )}
                  </div>

                  {/* Image preview */}
                  <div className="relative aspect-[16/9] bg-cream-deep border-b-2 border-ink overflow-hidden">
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground/40 gap-2">
                        <ImageIcon className="h-10 w-10" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {locale === "en" ? "No preview" : locale === "ca" ? "Sense vista prèvia" : "Sin vista previa"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body — newspaper style */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-newspaper font-bold text-xl leading-snug text-foreground line-clamp-3">
                      {title}
                    </h3>
                    {description && (
                      <p className="mt-2 text-sm text-foreground/70 leading-relaxed line-clamp-3 first-letter:font-newspaper first-letter:text-2xl first-letter:font-bold first-letter:text-coral first-letter:mr-1 first-letter:float-left first-letter:leading-none">
                        {description}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
                      {locale === "en" ? "Read article" : locale === "ca" ? "Llegir article" : "Leer artículo"}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 bg-cream-deep/40 border-t-2 border-ink/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative bg-coral border-4 border-ink rounded-[2.5rem] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-tactile-lg">
            <Calendar className="h-10 w-10 text-cream mx-auto" />
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-cream">
              {locale === "en"
                ? "Want to play with us?"
                : locale === "ca"
                  ? "Vols jugar amb nosaltres?"
                  : "¿Quieres jugar con nosotros?"}
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-cream text-foreground border-2 border-ink px-6 py-3.5 text-sm font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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

/* =========================
 * SUB-COMPONENTS
 * ========================= */

function ValueCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="p-7 rounded-3xl bg-card border-2 border-ink shadow-tactile-sm hover:shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all">
      <div className="h-12 w-12 rounded-2xl bg-coral text-cream border-2 border-ink flex items-center justify-center shadow-tactile-sm">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-display font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-base text-foreground/75 leading-relaxed">{body}</p>
    </div>
  );
}

function PartnerColumn({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-card border-2 border-ink rounded-3xl p-6 shadow-tactile-sm">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-dashed border-ink/15">
        <div className="size-10 rounded-xl bg-coral text-cream border-2 border-ink flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="text-sm font-medium px-3 py-1.5 rounded-full bg-cream-deep/60 border border-ink/20 text-foreground/80"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
