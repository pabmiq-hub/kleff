import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listBlogSlugsForSitemap } from "@/lib/blog.functions";

const BASE_URL = "https://kleff.es";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Static routes — keep in sync with src/routes/
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/actividades", changefreq: "weekly", priority: "0.9" },
          { path: "/como-funciona", changefreq: "monthly", priority: "0.8" },
          { path: "/ludoteca", changefreq: "weekly", priority: "0.8" },
          { path: "/sobre-nosotros", changefreq: "monthly", priority: "0.7" },
          { path: "/contacto", changefreq: "monthly", priority: "0.7" },
          { path: "/medios", changefreq: "monthly", priority: "0.6" },
          { path: "/torneos", changefreq: "weekly", priority: "0.7" },
          { path: "/catan", changefreq: "monthly", priority: "0.6" },
          { path: "/blood-on-the-clocktower", changefreq: "monthly", priority: "0.6" },
          { path: "/roles-ocultos", changefreq: "monthly", priority: "0.6" },
          { path: "/blog", changefreq: "weekly", priority: "0.9" },
          // English
          { path: "/en", changefreq: "weekly", priority: "0.9" },
          { path: "/en/activities", changefreq: "weekly", priority: "0.8" },
          { path: "/en/how-it-works", changefreq: "monthly", priority: "0.7" },
          { path: "/en/ludoteca", changefreq: "weekly", priority: "0.7" },
          { path: "/en/about", changefreq: "monthly", priority: "0.6" },
          { path: "/en/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/en/media", changefreq: "monthly", priority: "0.5" },
          { path: "/en/tournaments", changefreq: "weekly", priority: "0.6" },
          { path: "/en/blog", changefreq: "weekly", priority: "0.8" },
          // Catalan
          { path: "/ca", changefreq: "weekly", priority: "0.9" },
          { path: "/ca/activitats", changefreq: "weekly", priority: "0.8" },
          { path: "/ca/com-funciona", changefreq: "monthly", priority: "0.7" },
          { path: "/ca/ludoteca", changefreq: "weekly", priority: "0.7" },
          { path: "/ca/qui-som", changefreq: "monthly", priority: "0.6" },
          { path: "/ca/contacte", changefreq: "monthly", priority: "0.6" },
          { path: "/ca/mitjans", changefreq: "monthly", priority: "0.5" },
          { path: "/ca/tornejos", changefreq: "weekly", priority: "0.6" },
          { path: "/ca/blog", changefreq: "weekly", priority: "0.8" },
        ];

        // Blog post slugs (3 locales each)
        const { posts } = await listBlogSlugsForSitemap();
        const blogEntries: SitemapEntry[] = [];
        for (const p of posts) {
          const lastmod = p.published_at?.slice(0, 10);
          blogEntries.push({ path: `/${p.slug}`, lastmod, changefreq: "monthly", priority: "0.7" });
          blogEntries.push({ path: `/en/${p.slug}`, lastmod, changefreq: "monthly", priority: "0.7" });
          blogEntries.push({ path: `/ca/${p.slug}`, lastmod, changefreq: "monthly", priority: "0.7" });
        }

        const entries = [...staticEntries, ...blogEntries];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
