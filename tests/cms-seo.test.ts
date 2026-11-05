import { test, expect } from "bun:test";
import { readSeo, applySeo } from "../src/cms/seo";

const ld = (seo: Record<string, string>, locale = "es") => ({ pageContent: { locale, sections: { "about.seo": seo } } });

test("custom title, description and image replace defaults", () => {
  const head = applySeo({ meta: [{ title: "Old" }, { name: "description", content: "old" }] },
    readSeo(ld({ title: "Nuevo", description: "Desc", image: "https://x.es/a.jpg" })));
  expect(head.meta).toContainEqual({ title: "Nuevo" });
  expect(head.meta).toContainEqual({ property: "og:description", content: "Desc" });
  expect(head.meta).toContainEqual({ property: "og:image", content: "https://x.es/a.jpg" });
  expect(head.meta!.filter((m) => "title" in m).length).toBe(1);
});
test("empty fields keep the defaults", () => {
  const head = applySeo({ meta: [{ title: "Old" }] }, readSeo(ld({ title: "", description: "" })));
  expect(head.meta).toContainEqual({ title: "Old" });
});
test("not applied on other languages and relative images ignored", () => {
  expect(readSeo(ld({ title: "X" }, "en")).title).toBeUndefined();
  expect(readSeo(ld({ image: "/a.jpg" })).image).toBeUndefined();
});
