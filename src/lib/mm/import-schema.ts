import { z } from "zod";

const json = z.record(z.any()).default({});
const actKey = z.enum(["intro", "investigation", "conclusion"]);

export const mmImportSchema = z
  .object({
    game: z.object({
      slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "El slug solo admite minúsculas, números y guiones"),
      title: z.string().min(1),
      synopsis: z.string().optional(),
      cover_url: z.string().optional(),
      min_players: z.number().int().min(1),
      max_players: z.number().int().min(1),
      duration_minutes: z.number().int().min(1),
      theme: json,
      murder_event: json,
      final_reveal: json,
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
          alibi: z.string().optional(),
          relationships: z.array(z.any()).default([]),
          is_killer: z.boolean().default(false),
          victim: z.boolean().default(false),
          avatar_config: json,
          avatar_url: z.string().optional(),
          secrets: z.array(z.object({ content: z.string().min(1), known_by: z.array(z.string()).default([]), unlock_rule: z.any().optional() })).default([]),
          objectives: z
            .array(z.object({ act: z.string().optional(), text: z.string().min(1), completion_type: z.enum(["manual", "auto", "admin"]).default("manual"), auto_rule: z.any().optional(), points: z.number().int().default(1) }))
            .default([]),
          abilities: z
            .array(z.object({ name: z.string().min(1), description: z.string().optional(), effect_type: z.string().optional(), effect_config: json, max_uses: z.number().int().min(0).default(1), available_from_act: z.string().optional() }))
            .default([]),
          items: z.array(z.object({ name: z.string().min(1), description: z.string().optional(), image_url: z.string().optional(), available_from_act: z.string().optional() })).default([]),
          fragments: z.array(z.object({ label: z.string().min(1), value: z.string().optional(), group_key: z.string().min(1) })).default([]),
        }),
      )
      .min(1, "Debe haber al menos un personaje"),
    evidences: z
      .array(
        z.object({
          act: z.string().optional(),
          title: z.string().min(1),
          content: z.string().optional(),
          image_url: z.string().optional(),
          scope: z.enum(["common", "personal"]).default("common"),
          target: z.string().optional(),
          unlock_rule: z.record(z.any()).default({ type: "auto" }),
          reveal_style: z.string().optional(),
        }),
      )
      .default([]),
    joint_actions: z
      .array(z.object({ name: z.string().min(1), description: z.string().optional(), available_from_act: z.string().optional(), requirements: z.array(z.any()).default([]), results: z.array(z.any()).default([]) }))
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
    g.characters.forEach((c, i) => {
      c.secrets.forEach((s, j) => s.known_by.forEach((r) => !refs.has(r) && err(["characters", i, "secrets", j, "known_by"], `Personaje «${r}» inexistente`)));
      c.objectives.forEach((o, j) => checkAct(o.act, ["characters", i, "objectives", j, "act"]));
      c.abilities.forEach((o, j) => checkAct(o.available_from_act, ["characters", i, "abilities", j]));
      c.items.forEach((o, j) => checkAct(o.available_from_act, ["characters", i, "items", j]));
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
  });

export type MMImport = z.infer<typeof mmImportSchema>;

export function formatImportErrors(e: z.ZodError): string[] {
  return e.issues.map((i) => `${i.path.join(" › ") || "raíz"}: ${i.message}`);
}
