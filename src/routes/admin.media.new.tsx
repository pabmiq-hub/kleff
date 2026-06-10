import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { MediaAppearanceForm } from "@/components/admin/MediaAppearanceForm";

export const Route = createFileRoute("/admin/media/new")({
  head: () => ({
    meta: [
      { title: "Nueva publicación — Admin KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NewMediaPage,
});

function NewMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/media"
          className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a Medios
        </Link>
        <h1 className="mt-2 text-2xl font-display font-semibold">Nueva publicación</h1>
      </div>
      <MediaAppearanceForm />
    </div>
  );
}
