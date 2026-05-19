import { Fragment } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSectionContent } from "@/cms/useSectionContent";
import { EditableText } from "@/editor/Editable";
import { or } from "@/cms/or";
import { openCookieSettings } from "@/components/site/CookieConsent";

type LegalPageKind = "legal-notice" | "privacy" | "cookies" | "terms";

type HeroFields = {
  eyebrow?: string;
  title?: string;
  lastUpdated?: string;
  companyName?: string;
  companyId?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyRegistry?: string;
};

type InventoryItem = {
  name?: string;
  provider?: string;
  category?: string;
  purpose?: string;
  duration?: string;
};

const LABEL: Record<LegalPageKind, { eyebrow: string; title: string }> = {
  "legal-notice": { eyebrow: "Información legal", title: "Aviso Legal" },
  privacy: { eyebrow: "Tus datos", title: "Política de Privacidad" },
  cookies: { eyebrow: "Cookies", title: "Política de Cookies" },
  terms: { eyebrow: "Condiciones", title: "Términos y Condiciones" },
};

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const hero = useSectionContent<HeroFields>(`${kind}.hero`);
  const content = useSectionContent<{ body?: string }>(`${kind}.content`);
  const inventory = useSectionContent<{ title?: string; items?: InventoryItem[] }>(`cookies.inventory`);

  const showCompany = kind !== "cookies";
  const showInventory = kind === "cookies";
  const showCookieButton = kind === "cookies";

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12">
          <EditableText
            id={`${kind}.hero.eyebrow`}
            as="span"
            className="inline-flex items-center gap-2 rounded-full bg-primary-soft/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-coral-deep"
          >
            {or(hero.eyebrow, LABEL[kind].eyebrow)}
          </EditableText>
          <EditableText
            id={`${kind}.hero.title`}
            as="h1"
            className="mt-5 text-4xl sm:text-5xl font-display font-semibold text-foreground"
          >
            {or(hero.title, LABEL[kind].title)}
          </EditableText>
          <EditableText
            id={`${kind}.hero.lastUpdated`}
            as="p"
            className="mt-4 text-sm text-muted-foreground"
          >
            Última actualización: {or(hero.lastUpdated, "Mayo de 2026")}
          </EditableText>

          {showCompany && (
            <div className="mt-6 grid gap-2 rounded-2xl border border-border/60 bg-card/70 p-5 text-sm text-foreground/85 sm:grid-cols-2">
              {hero.companyName && (
                <div><span className="font-semibold">Titular:</span> {hero.companyName}</div>
              )}
              {hero.companyId && (
                <div><span className="font-semibold">NIF / CIF:</span> {hero.companyId}</div>
              )}
              {hero.companyAddress && (
                <div className="sm:col-span-2"><span className="font-semibold">Domicilio:</span> {hero.companyAddress}</div>
              )}
              {hero.companyEmail && (
                <div className="sm:col-span-2">
                  <span className="font-semibold">Email:</span>{" "}
                  <a href={`mailto:${hero.companyEmail}`} className="text-coral-deep hover:underline">
                    {hero.companyEmail}
                  </a>
                </div>
              )}
              {hero.companyRegistry && (
                <div className="sm:col-span-2 text-foreground/70">{hero.companyRegistry}</div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <RichText source={content.body ?? ""} />

          {showCookieButton && (
            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openCookieSettings}
                className="inline-flex items-center gap-2 rounded-full bg-coral text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-glow hover:shadow-warm hover:-translate-y-0.5 transition-all"
              >
                Configurar mis cookies
              </button>
            </div>
          )}

          {showInventory && inventory.items && inventory.items.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                {or(inventory.title, "Cookies que utilizamos")}
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Proveedor</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Finalidad</th>
                      <th className="px-4 py-3">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {inventory.items.map((c, i) => (
                      <tr key={i} className="align-top">
                        <td className="px-4 py-3 font-mono text-xs">{c.name}</td>
                        <td className="px-4 py-3">{c.provider}</td>
                        <td className="px-4 py-3 capitalize">{c.category}</td>
                        <td className="px-4 py-3 text-foreground/80">{c.purpose}</td>
                        <td className="px-4 py-3">{c.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

// Markdown-lite renderer: `## ` h2, `### ` h3, `- ` bullets, blank-line paragraphs.
function RichText({ source }: { source: string }) {
  const blocks = source
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 text-foreground/85 leading-relaxed">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-10 text-2xl font-display font-semibold text-foreground">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("### ")) {
          return (
            <h3 key={i} className="mt-6 text-lg font-display font-semibold text-foreground">
              {block.slice(4)}
            </h3>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc pl-6 space-y-2">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {l}
                {j < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
