import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Newspaper } from "lucide-react";

export function BlogPage() {
  const { locale } = useI18n();

  const copy = {
    es: {
      eyebrow: "Blog",
      title: "Próximamente",
      body:
        "Estamos conectando esta sección con tu WordPress para que tus posts existentes aparezcan aquí automáticamente, conservando las URLs y el posicionamiento. Mientras tanto, puedes seguir publicando como siempre.",
    },
    en: {
      eyebrow: "Blog",
      title: "Coming soon",
      body:
        "We're wiring this section to your WordPress so your existing posts show up here automatically — keeping URLs and SEO intact. In the meantime, keep publishing as usual.",
    },
    ca: {
      eyebrow: "Blog",
      title: "Pròximament",
      body:
        "Estem connectant aquesta secció amb el teu WordPress perquè les publicacions actuals apareguin aquí automàticament, conservant URLs i posicionament. Mentrestant, pots continuar publicant com sempre.",
    },
  }[locale];

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-coral-deep">
            {copy.eyebrow}
          </div>
          <Newspaper className="h-12 w-12 text-coral mx-auto mt-8" />
          <h1 className="mt-5 text-5xl sm:text-6xl font-display font-semibold text-foreground">
            {copy.title}
          </h1>
          <p className="mt-6 text-lg text-foreground/75 leading-relaxed">{copy.body}</p>
        </div>
      </section>
    </SiteLayout>
  );
}
