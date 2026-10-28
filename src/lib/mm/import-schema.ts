import { z } from "zod";
import { readingSchema } from "./readings";
import { useSchema } from "./interactions";
import { importedAvatarUrl, normalizeAvatarUrl, sanitizeAvatarSvg } from "./avatar-import";

const json = z.record(z.any()).default({});
const actKey = z.enum(["intro", "investigation", "conclusion"]);

export const mmImportSchema = z
  .object({
    game: z.object({
      slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "El slug solo admite minúsculas, números y guiones"),
      title: z.string().min(1),
      synopsis: z.string().optional(),
      map_url: z.string().optional(),
      cover_url: z.string().optional(),
      genre: z.string().trim().max(60).optional(),
      difficulty: z.enum(["facil", "media", "dificil"]).optional(),
      min_players: z.number().int().min(1),
      max_players: z.number().int().min(1),
      duration_minutes: z.number().int().min(1),
      theme: json,
      murder_event: json,
      final_reveal: json,
      briefing: z.string().optional(),
      economy: z.object({ currency: z.literal("EUR").default("EUR"), richest_award: z.number().int().min(0).default(20), income_events: z.array(z.object({ ref: z.string(), character: z.string(), act: actKey, amount: z.number().int().positive(), title: z.string().optional() })).default([]) }).optional(),
    }),
    acts: z
      .array(z.object({ key: actKey, name: z.string().min(1), narrative_text: z.string().optional(), duration_minutes: z.number().int().min(1), intro_animation: z.string().optional() }))
      .min(1, "Debe haber al menos un acto"),
    characters: z
      .array(
        z.object({
          ref: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          public_summary: z.string().optional(),
          costume: z.string().optional(),
          alibi: z.string().optional(),
          relationships: z.array(z.any()).default([]),
          is_killer: z.boolean().default(false),
          victim: z.boolean().default(false),
          avatar_config: json,
           avatar_url: z.string().nullish().refine((value) => !value || normalizeAvatarUrl(value) !== null, "El avatar debe ser una imagen HTTPS o una imagen incrustada válida"),
           avatar_svg: z.string().nullish().refine((value) => !value || sanitizeAvatarSvg(value) !== null, "avatar_svg debe ser un dibujo SVG válido, sin scripts ni recursos externos"),
          secrets: z.array(z.object({ content: z.string().min(1), known_by: z.array(z.string()).default([]), unlock_rule: z.any().optional() })).default([]),
          objectives: z
            .array(z.object({ act: z.string().optional(), text: z.string().min(1), completion_type: z.enum(["manual", "auto", "admin"]).default("manual"), auto_rule: z.any().optional(), points: z.number().int().default(1) }))
            .default([]),
          abilities: z
            .array(z.object({ ref: z.string().optional(), name: z.string().min(1), description: z.string().optional(), effect_type: z.string().optional(), effect_config: json, use: useSchema.optional(), max_uses: z.number().int().min(0).default(1), available_from_act: z.string().optional() }))
            .default([]),
          items: z.array(z.object({ ref: z.string().optional(), name: z.string().min(1), description: z.string().optional(), image_url: z.string().optional(), available_from_act: z.string().optional(), type: z.enum(["item", "money"]).default("item"), amount: z.number().int().min(0).max(2147483647).default(0), currency: z.literal("EUR").default("EUR"), use: useSchema.optional(), on_receive: z.object({ text: z.string().optional(), evidence: z.string().optional() }).optional() })).default([]),
          fragments: z.array(z.object({ label: z.string().min(1), value: z.string().optional(), group_key: z.string().min(1) })).default([]),
         }).transform((character) => ({ ...character, avatar_url: importedAvatarUrl(character) })),
      )
      .min(1, "Debe haber al menos un personaje"),
    evidences: z
      .array(
        z.object({
          act: z.string().optional(),
          ref: z.string().optional(), title: z.string().min(1),
          content: z.string().optional(),
          image_url: z.string().optional(),
          scope: z.enum(["common", "personal"]).default("common"),
          target: z.string().optional(),
          unlock_rule: z.record(z.any()).default({ type: "auto" }),
          reveal_style: z.string().optional(),
        }),
      )
      .default([]),
    readings: z.array(readingSchema).default([]),
    locations: z
      .array(
        z.object({
          ref: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100),
          act: actKey.optional(),
          image_url: z.string().optional(),
          features: z
            .array(
              z.object({
                ref: z.string().min(1),
                name: z.string().min(1),
                teaser: z.string().optional(),
                locked_hint: z.string().optional(),
                content: z.string({ required_error: "Cada elemento debe tener «content»" }).min(1, "Cada elemento debe tener «content»"),
                act: actKey.optional(),
                image_url: z.string().optional(),
                requires: z.object({ character: z.string().optional(), item: z.string().optional(), ability: z.string().optional() }).default({}),
                evidence: z.string().optional(),
              }),
            )
            .default([]),
        }),
      )
      .default([]),
    joint_actions: z
      .array(z.object({ ref: z.string().optional(), name: z.string().min(1), description: z.string().optional(), proposal_text: z.string().optional(), requires_acceptance: z.boolean().default(true), available_from_act: z.string().optional(), requirements: z.array(z.object({ role: z.string(), character: z.string().optional(), item: z.string().optional(), ability: z.string().optional(), fragment: z.string().optional() })).min(1), results: z.array(z.object({ role: z.string().optional(), text: z.string().optional(), evidence: z.string().optional(), secret: z.string().optional(), money: z.number().int().optional() })).default([]) }))
      .default([]),
  })
  .superRefine((g, ctx) => {
    const refs = new Set(g.characters.map((c) => c.ref));
    const acts = new Set(g.acts.map((a) => a.key));
    const err = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    if (refs.size !== g.characters.length) err(["characters"], "Hay personajes con el mismo «ref»");
    if (g.characters.filter((c) => c.is_killer).length !== 1) err(["characters"], "Debe haber exactamente un asesino (is_killer)");
    if (g.game.min_players > g.game.max_players) err(["game", "min_players"], "min_players no puede ser mayor que max_players");
    const checkAct = (a: string | undefined, path: (string | number)[]) => {
      if (a && !acts.has(a as never)) err(path, `El acto «${a}» no existe`);
    };
    g.readings.forEach((r, i) => {
      checkAct(r.act, ["readings", i, "act"]);
      if (r.reader !== "host" && !g.characters.some((c) => c.ref === r.reader && !c.victim))
        err(["readings", i, "reader"], "El lector debe ser un personaje jugable existente o «host» (anfitrión)");
      if (r.trigger === "murder" && r.act !== "investigation")
        err(["readings", i, "trigger"], "La lectura del asesinato debe pertenecer a investigation");
      if (r.trigger === "final_reveal" && r.act !== "conclusion")
        err(["readings", i, "trigger"], "La lectura de la solución debe pertenecer a conclusion");
    });
    g.characters.forEach((c, i) => {
      if (c.items.filter(x => x.type === "money").length > 1) err(["characters", i, "items"], "Un personaje solo puede tener una cartera");
      c.secrets.forEach((s, j) => s.known_by.forEach((r) => !refs.has(r) && err(["characters", i, "secrets", j, "known_by"], `Personaje «${r}» inexistente`)));
      c.objectives.forEach((o, j) => checkAct(o.act, ["characters", i, "objectives", j, "act"]));
      c.abilities.forEach((o, j) => checkAct(o.available_from_act, ["characters", i, "abilities", j]));
      c.items.forEach((o, j) => checkAct(o.available_from_act, ["characters", i, "items", j]));
    });
    const jointRefs = new Set(g.joint_actions.flatMap(j => [j.ref, j.name].filter(Boolean)));
    g.characters.forEach((c, i) => [...c.items, ...c.abilities].forEach(x => {
      if (x.use?.mode === "joint_action" && (!x.use.action || !jointRefs.has(x.use.action))) err(["characters", i], "La acción indicada en use.action no existe");
    }));
    g.game.economy?.income_events.forEach((e, i) => {
      if (!refs.has(e.character)) err(["game", "economy", "income_events", i], "Personaje del ingreso inexistente");
      checkAct(e.act, ["game", "economy", "income_events", i]);
    });
    g.evidences.forEach((e, i) => {
      checkAct(e.act, ["evidences", i, "act"]);
      if (e.scope === "personal" && (!e.target || !refs.has(e.target))) err(["evidences", i, "target"], "Evidencia personal sin personaje destinatario válido");
    });
    g.joint_actions.forEach((ja, i) => {
      checkAct(ja.available_from_act, ["joint_actions", i]);
      ja.requirements.forEach((r: any, j: number) => {
        const ref = r?.character;
        if (ref && ref !== "cualquiera" && !refs.has(ref)) err(["joint_actions", i, "requirements", j], `Personaje «${ref}» inexistente`);
      });
    });
    // Castle map
    const actOrder = (k?: string) => (k ? g.acts.findIndex((a) => a.key === k) : -1);
    const evRefs = new Set(g.evidences.map((e) => e.ref).filter(Boolean));
    const itemKeys = new Set(g.characters.flatMap((c) => c.items.flatMap((x) => [x.ref, x.name].filter(Boolean) as string[])));
    const abilityKeys = new Set(g.characters.flatMap((c) => c.abilities.flatMap((x) => [x.ref, x.name].filter(Boolean) as string[])));
    const locRefs = new Set<string>();
    const featRefs = new Set<string>();
    g.locations.forEach((l, i) => {
      if (locRefs.has(l.ref)) err(["locations", i, "ref"], `Lugar con «ref» repetido: ${l.ref}`);
      locRefs.add(l.ref);
      g.locations.slice(0, i).forEach((o) => {
        if (Math.abs(o.x - l.x) < 22 && Math.abs(o.y - l.y) < 18) err(["locations", i], `«${l.name}» está demasiado cerca de «${o.name}» en el plano (mínimo 22 en horizontal o 18 en vertical)`);
      });
      l.features.forEach((f, j) => {
        const p = ["locations", i, "features", j];
        if (featRefs.has(f.ref)) err([...p, "ref"], `Elemento con «ref» repetido: ${f.ref}`);
        featRefs.add(f.ref);
        if (f.act && l.act && actOrder(f.act) < actOrder(l.act)) err([...p, "act"], `«${f.name}» no puede estar en un acto anterior a su lugar`);
        if (f.evidence && !evRefs.has(f.evidence)) err([...p, "evidence"], `Prueba «${f.evidence}» inexistente`);
        const r = f.requires;
        if (r.character && r.character !== "cualquiera" && !refs.has(r.character)) err([...p, "requires", "character"], `Personaje «${r.character}» inexistente`);
        if (r.item && !itemKeys.has(r.item)) err([...p, "requires", "item"], `Objeto «${r.item}» inexistente`);
        if (r.ability && !abilityKeys.has(r.ability)) err([...p, "requires", "ability"], `Habilidad «${r.ability}» inexistente`);
      });
    });
  });

export type MMImport = z.infer<typeof mmImportSchema>;

export function formatImportErrors(e: z.ZodError): string[] {
  return e.issues.map((i) => `${i.path.join(" › ") || "raíz"}: ${i.message}`);
}
