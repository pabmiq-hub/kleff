import { Link } from "@tanstack/react-router";
import { Heart, Globe2, Smile, ArrowRight, Calendar } from "lucide-react";
import venueImg from "@/assets/about-venue.jpg";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";

const COMMUNITIES = [
  {
    name: "Blood on the Clocktower",
    blurb: {
      es: "El juego de roles ocultos mejor valorado en BGG. Mínimo 2 partidas semanales.",
      en: "The top-rated hidden roles game on BGG. At least 2 games every week.",
      ca: "El joc de rols ocults millor valorat a BGG. Mínim 2 partides setmanals.",
    },
  },
  {
    name: "Catan",
    blurb: {
      es: "El precursor de los juegos modernos. Torneos y actividades recurrentes.",
      en: "The precursor to modern board games. Recurring tournaments and events.",
      ca: "El precursor dels jocs moderns. Tornejos i activitats recurrents.",
    },
  },
  {
    name: "Unmatched",
    blurb: {
      es: "El juego de enfrentamientos más popular del momento. Torneos frecuentes.",
      en: "The most popular skirmish game right now. Frequent tournaments.",
      ca: "El joc d'enfrontaments més popular del moment. Tornejos freqüents.",
    },
  },
  {
    name: "Roles Ocultos",
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

const PRESS = [
  { date: "JUN 2025", outlet: "Aquí Barcelona — Cadena SER" },
  { date: "MAY 2025", outlet: "Culturas 2 (RTVE)" },
  { date: "MAY 2025", outlet: "Punts de Vista (RTVE)" },
  { date: "MAR 2025", outlet: "Time Out" },
  { date: "MAR 2025", outlet: "El Periódico" },
  { date: "FEB 2025", outlet: "Sara Postcard — Planes en Barcelona" },
  { date: "NOV 2022", outlet: "Vidas Infinitas (podcast)" },
  { date: "NOV 2019", outlet: "El Periódico" },
];

const TEAM = [
  { name: "Coming soon", role: "Founder & Host", emoji: "🎲" },
  { name: "Coming soon", role: "Community Lead", emoji: "🎯" },
  { name: "Coming soon", role: "Events", emoji: "🎉" },
  { name: "Coming soon", role: "Tournaments", emoji: "🏆" },
];

export function AboutPage() {
  const { t, locale, href } = useI18n();

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-coral-deep">
              {t.about.eyebrow}
            </span>
            <h1 className="mt-5 text-5xl sm:text-6xl font-display font-semibold leading-[1.02] text-foreground">
              {t.about.title}
            </h1>
            <p className="mt-6 text-lg text-foreground/75 max-w-2xl leading-relaxed">
              {t.about.intro}
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-coral rounded-3xl blur-2xl opacity-30" />
              <img
                src={venueImg}
                alt="L'Estació de França — sede de KLEFF"
                width={1600}
                height={1000}
                loading="lazy"
                className="relative rounded-3xl shadow-warm w-full h-[360px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-display font-semibold text-foreground">
            {t.about.storyTitle}
          </h2>
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-foreground/80">
            <p>{t.about.storyP1}</p>
            <p>{t.about.storyP2}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-cream-deep/60">
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

      {/* Team */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-display font-semibold text-foreground">
              {t.about.teamTitle}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t.about.teamSubtitle}</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((m, i) => (
              <TeamCard key={i} {...m} />
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground italic">
            {locale === "es"
              ? "Pronto añadiremos las fichas reales del equipo. Envíanos vuestras fotos y bios."
              : locale === "en"
                ? "We'll add the real team profiles soon. Send us your photos and bios."
                : "Aviat afegirem les fitxes reals de l'equip. Envieu-nos les vostres fotos i bios."}
          </p>
        </div>
      </section>

      {/* Communities */}
      <section className="py-20 bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-display font-semibold text-cream max-w-2xl">
            {t.about.communitiesTitle}
          </h2>
          <div className="mt-12 grid md:grid-cols-2 gap-5">
            {COMMUNITIES.map((c) => (
              <div
                key={c.name}
                className="p-6 rounded-2xl bg-cream/5 border border-cream/10 hover:border-coral/40 transition-colors"
              >
                <h3 className="text-2xl font-display font-semibold text-coral">{c.name}</h3>
                <p className="mt-2 text-cream/75 leading-relaxed">{c.blurb[locale]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities quick view */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-display font-semibold text-foreground max-w-2xl">
            {t.about.activitiesTitle}
          </h2>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <ActivityCard label={t.about.weekly} title="Game Night" body="Ludoteca abierta + partidas programadas." />
            <ActivityCard label={t.about.monthly} title="Torneos & demostraciones" body="Eventos competitivos y novedades." />
            <ActivityCard
              label={t.about.yearly}
              title="Carnival · Halloween · X-mas"
              body="Game Nights especiales con concursos y eventos solidarios."
            />
            <ActivityCard
              label={t.about.occasional}
              title="Slow Dating Lúdico"
              body="Conectar personas a través de juegos sociales."
            />
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 bg-cream-deep/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-display font-semibold text-foreground max-w-2xl">
            {t.about.partnersTitle}
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <PartnerColumn title={t.about.partnersAssociations} items={PARTNERS.associations} />
            <PartnerColumn title={t.about.partnersShops} items={PARTNERS.shops} />
            <PartnerColumn title={t.about.partnersPublishers} items={PARTNERS.publishers} />
          </div>
        </div>
      </section>

      {/* Press */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-display font-semibold text-foreground">
            {t.about.pressTitle}
          </h2>
          <ul className="mt-10 divide-y divide-border/60">
            {PRESS.map((p, i) => (
              <li key={i} className="py-4 flex items-baseline justify-between gap-4">
                <span className="text-base sm:text-lg font-medium text-foreground">{p.outlet}</span>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-coral-deep">
                  {p.date}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] bg-gradient-coral px-8 sm:px-14 py-12 sm:py-14 text-center shadow-warm">
            <Calendar className="h-10 w-10 text-cream mx-auto" />
            <h2 className="mt-4 text-3xl sm:text-4xl font-display font-semibold text-cream">
              {t.home.joinTitle}
            </h2>
            <Link
              to={href("/contact")}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3.5 text-sm font-semibold text-coral-deep hover:bg-cream-deep transition-colors"
            >
              {t.nav.contact}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ValueCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="p-7 rounded-3xl bg-card border border-border/60 hover:border-coral/40 hover:shadow-soft transition-all">
      <div className="h-12 w-12 rounded-2xl bg-coral/15 text-coral-deep flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-display font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-base text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function ActivityCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/60">
      <span className="text-xs font-semibold uppercase tracking-wider text-coral-deep">{label}</span>
      <h3 className="mt-2 text-xl font-display font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function PartnerColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold text-foreground mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-base text-foreground/75">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamCard({ name, role, emoji }: { name: string; role: string; emoji: string }) {
  return (
    <div className="group p-6 rounded-3xl bg-card border border-border/60 hover:border-coral/40 hover:-translate-y-1 hover:shadow-warm transition-all duration-300">
      <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-soft/60 to-coral/30 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
        {emoji}
      </div>
      <div className="mt-4">
        <div className="text-lg font-display font-semibold text-foreground">{name}</div>
        <div className="text-sm text-coral-deep">{role}</div>
      </div>
    </div>
  );
}
