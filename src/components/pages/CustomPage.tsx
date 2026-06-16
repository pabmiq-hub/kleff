import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { BlockRow } from "@/lib/blocks.functions";

export function CustomPage({ title, blocks }: { title: string; blocks: BlockRow[] }) {
  useI18n(); // ensure provider is initialized
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold text-foreground">
            {title}
          </h1>
        </div>
      </section>
      {blocks.length > 0 ? (
        <BlockRenderer blocks={blocks} />
      ) : (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center text-muted-foreground">
          <p className="text-sm italic">Esta página aún no tiene contenido publicado.</p>
        </div>
      )}
    </SiteLayout>
  );
}
