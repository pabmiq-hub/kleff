import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages/ContactPage";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — KLEFF" },
      { name: "description", content: "Contacta con KLEFF para colaborar, organizar eventos privados o resolver dudas." },
      { property: "og:title", content: "Contacto — KLEFF" },
      { property: "og:description", content: "Hablemos. Estamos en l'Estació de França, Barcelona." },
    ],
  }),
  component: ContactPage,
});
