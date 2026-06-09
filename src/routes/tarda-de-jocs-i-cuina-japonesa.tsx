import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tarda-de-jocs-i-cuina-japonesa")({
  head: () => ({
    meta: [
      { title: "Tarda de jocs i cuina japonesa — KLEFF" },
      { name: "description", content: "Inscripció a la tarda de jocs i cuina japonesa amb KLEFF i Kasa Hanaka." },
      { property: "og:title", content: "Tarda de jocs i cuina japonesa — KLEFF" },
      { property: "og:description", content: "Inscripció a la tarda de jocs i cuina japonesa amb KLEFF i Kasa Hanaka." },
    ],
  }),
  component: TardaJocsCuinaPage,
});

function TardaJocsCuinaPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-cream">
      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
        <h1 className="mb-10 text-center font-display text-3xl font-bold text-ink md:text-4xl">
          Tarda de jocs i cuina japonesa
        </h1>
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-tactile">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLScjQyvmm9ye3ghNP9Zy38rM2OQwA-YQQBkv7tvwR89qA8VSIQ/viewform?embedded=true"
            width="100%"
            height="1200"
            style={{ border: 0 }}
            title="Formulari d'inscripció"
            loading="lazy"
          >
            Carregant formulari…
          </iframe>
        </div>
      </div>
    </div>
  );
}
