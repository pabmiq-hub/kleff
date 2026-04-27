import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Globe2, Sparkles, Dice5, ExternalLink } from "lucide-react";
import venueImg from "@/assets/about-venue.jpg";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { HistoryTimeline } from "@/components/about/HistoryTimeline";

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
              <Sparkles className="h-3.5 w-3.5" /> {t.about.eyebrow}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[1.02] tracking-normal text-foreground break-words">
              {locale === "en" ? (
                <>
                  De una <span className="marker-coral">depresión</span> a la mayor comunidad
                  de juegos de mesa de Barcelona.
                </>
              ) : locale === "ca" ? (
                <>
                  D'una <span className="marker-coral">depressió</span> a la comunitat de jocs
                  de taula més gran de Barcelona.
                </>
              ) : (
                <>
                  De una <span className="marker-coral">depresión</span> a la comunidad de
                  juegos de mesa más grande de Barcelona.
                </>
              )}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-foreground/75 max-w-2xl leading-relaxed">
              {locale === "en"
                ? "Six years, one purpose: turning tables into meeting points. This is the story of how KLEFF came to be."
                : locale === "ca"
                  ? "Sis anys, un propòsit: convertir taules en punts de trobada. Aquesta és la història de com va néixer KLEFF."
                  : "Seis años, un propósito: convertir mesas en puntos de encuentro. Esta es la historia de cómo nació KLEFF."}
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
                ? "Scroll to follow the story →"
                : locale === "ca"
                  ? "Desplaça't per seguir la història →"
                  : "Desliza para seguir la historia →"}
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-10">
          <HistoryTimeline locale={locale} />
        </div>
      </section>

      {/* MANIFESTO — what drives us */}
      <section className="relative py-24 md:py-32 bg-coral text-cream overflow-hidden">
        {/* Decorative giant quote */}
        <div className="absolute -top-12 left-4 sm:left-12 text-[14rem] sm:text-[20rem] font-display leading-none text-cream/15 select-none pointer-events-none">
          “
        </div>
        <div className="absolute -bottom-32 right-4 sm:right-12 text-[14rem] sm:text-[20rem] font-display leading-none text-cream/15 select-none pointer-events-none rotate-180">
          “
        </div>
        {/* Floating dice */}
        <div className="absolute top-12 right-10 size-16 bg-cream/10 border-2 border-cream/30 rounded-2xl rotate-12 hidden md:block animate-wiggle" />
        <div className="absolute bottom-16 left-16 size-12 bg-cream/10 border-2 border-cream/30 rounded-full hidden md:block animate-wiggle" style={{ animationDelay: "1s" }} />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-cream text-coral-deep px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] mb-8 border-2 border-ink shadow-tactile-sm">
            {locale === "en" ? "What drives us" : locale === "ca" ? "El que ens mou" : "Lo que nos mueve"}
          </span>
          <blockquote className="font-display font-semibold text-3xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-cream">
            {manifestoLine1}
            <br />
            <span className="italic text-cream">{manifestoLine2}</span>
          </blockquote>
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="w-10 h-px bg-cream" />
            <span className="text-xs font-bold tracking-[0.3em] text-cream/85">
              {locale === "en"
                ? "PAU · KLEFF FOUNDER"
                : locale === "ca"
                  ? "PAU · FUNDADOR DE KLEFF"
                  : "PAU · FUNDADOR DE KLEFF"}
            </span>
            <div className="w-10 h-px bg-cream" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 bg-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative bg-cream border-4 border-ink rounded-[2.5rem] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-tactile-lg">
            <Calendar className="h-10 w-10 text-coral mx-auto" />
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-foreground">
              {locale === "en"
                ? "Want to be part of what comes next?"
                : locale === "ca"
                  ? "Vols formar part del que vindrà?"
                  : "¿Quieres formar parte de lo que viene?"}
            </h2>
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
