import { describe, expect, test } from "bun:test";
import { mmImportSchema } from "../src/lib/mm/import-schema";
import { importedAvatarUrl, sanitizeAvatarSvg } from "../src/lib/mm/avatar-import";

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="20" y="25" width="88" height="78" rx="18" fill="#9dbb83"/><path d="M35 43h58" stroke="#262e33" stroke-width="8"/><circle cx="45" cy="60" r="5"/><circle cx="83" cy="60" r="5"/><path d="M43 85h42" stroke="#262e33" stroke-width="4"/><rect x="10" y="68" width="10" height="12" fill="#888888"/><rect x="108" y="68" width="10" height="12" fill="#888888"/></svg>';
const fixture = (avatar: Record<string, unknown>) => ({
  game: { slug: "avatar-original", title: "Misterio", min_players: 1, max_players: 1, duration_minutes: 30 },
  acts: [{ key: "intro", name: "Inicio", duration_minutes: 30 }],
  characters: [{ ref: "frank", name: "Frankenstein", is_killer: true, ...avatar }],
});

describe("Avatares originales de Claude", () => {
  test("conserva el SVG original como imagen, por delante de la configuración y URL", () => {
    const character = mmImportSchema.parse(fixture({ avatar_svg: svg, avatar_url: "https://kleff.es/avatar.png", avatar_config: { top: "shortFlat" } })).characters[0];
    expect(character.avatar_url).toBe(importedAvatarUrl({ avatar_svg: svg }));
    expect(decodeURIComponent(character.avatar_url?.split(",")[1] ?? "")).toBe(svg);
  });
  test("conserva imágenes HTTPS sin generar sustitutos", () => {
    expect(mmImportSchema.parse(fixture({ avatar_url: "https://kleff.es/avatar.png" })).characters[0].avatar_url).toBe("https://kleff.es/avatar.png");
  });
  test("acepta null y juegos antiguos sin dibujo", () => {
    expect(mmImportSchema.parse(fixture({ avatar_url: null })).characters[0].avatar_url).toBeNull();
    expect(mmImportSchema.parse(fixture({ avatar_config: { top: "shortFlat" } })).characters[0].avatar_config).toEqual({ top: "shortFlat" });
  });
  test("rechaza scripts, eventos, entidades y recursos externos", () => {
    for (const payload of ['<script>alert(1)</script>', '<foreignObject/>', '<image href="https://example.com/a.png"/>', '<use href="&#104;ttps://example.com/a.svg"/>', '<circle onload="alert(1)"/>', '<path style="fill:url(https://example.com/a.svg)"/>']) {
      expect(mmImportSchema.safeParse(fixture({ avatar_svg: `<svg xmlns="http://www.w3.org/2000/svg">${payload}</svg>` })).success).toBe(false);
    }
    expect(sanitizeAvatarSvg('<!DOCTYPE svg [<!ENTITY x "bad">]><svg>&x;</svg>')).toBeNull();
    expect(sanitizeAvatarSvg('<svg><path></svg>')).toBeNull();
  });
  test("permite gradientes y referencias locales seguros", () => {
    expect(sanitizeAvatarSvg('<svg><defs><linearGradient id="paint"><stop offset="0" stop-color="#abc"/></linearGradient></defs><circle r="10" fill="url(#paint)"/></svg>')).not.toBeNull();
  });
  test("valida también SVG incrustados en avatar_url", () => {
    expect(mmImportSchema.parse(fixture({ avatar_url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` })).characters[0].avatar_url).toBe(importedAvatarUrl({ avatar_svg: svg }));
    expect(mmImportSchema.safeParse(fixture({ avatar_url: "javascript:alert(1)" })).success).toBe(false);
  });
});