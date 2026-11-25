import { useMemo, useState } from "react";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const OPTS = {
  top: ["shortFlat","shortRound","shortWaved","shortCurly","theCaesar","theCaesarAndSidePart","sides","shavedSides","shaggy","shaggyMullet","frizzle","fro","froBand","curly","curvy","bob","bun","bigHair","longButNotTooLong","miaWallace","straight01","straight02","straightAndStrand","dreads","dreads01","dreads02","frida","hat","winterHat1","winterHat02","winterHat03","winterHat04","hijab","turban","none"],
  eyes: ["default","happy","wink","winkWacky","squint","side","surprised","hearts","eyeRoll","closed","cry","xDizzy"],
  eyebrows: ["default","defaultNatural","raisedExcited","raisedExcitedNatural","flatNatural","upDown","upDownNatural","angry","angryNatural","sadConcerned","sadConcernedNatural","frownNatural","unibrowNatural"],
  mouth: ["smile","default","twinkle","tongue","serious","eating","disbelief","concerned","grimace","sad","screamOpen","vomit"],
  facialHair: ["none","beardLight","beardMedium","beardMajestic","moustacheFancy","moustacheMagnum"],
  accessories: ["none","prescription01","prescription02","round","kurt","wayfarers","sunglasses","eyepatch"],
  clothing: ["hoodie","shirtCrewNeck","shirtScoopNeck","shirtVNeck","graphicShirt","collarAndSweater","blazerAndShirt","blazerAndSweater","overall"],
} as const;
const COLORS = {
  skinColor: ["ffdbb4","edb98a","d08b5b","ae5d29","614335","fd9841","f8d25c"],
  hairColor: ["2c1b18","4a312c","724133","a55728","b58143","d6b370","ecdcbf","e8e1e1","c93305","f59797"],
  clothesColor: ["262e33","3c4f5c","25557c","5199e4","65c9ff","a7ffc4","ffffb1","ffafb9","ff488e","ff5c5c","e6e6e6","ffffff"],
} as const;

type OptKey = keyof typeof OPTS;
type ColKey = keyof typeof COLORS;
export type AvatarConfig = Record<OptKey | ColKey, string>;

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)] as T;
export function randomAvatarConfig(): AvatarConfig {
  const c = {} as AvatarConfig;
  for (const k of Object.keys(OPTS) as OptKey[]) c[k] = pick(OPTS[k]);
  for (const k of Object.keys(COLORS) as ColKey[]) c[k] = pick(COLORS[k]);
  if (Math.random() < 0.7) c.facialHair = "none";
  if (Math.random() < 0.7) c.accessories = "none";
  return c;
}
export function avatarUri(c: AvatarConfig): string {
  const opt = (k: OptKey) => (c[k] === "none" ? {} : { [k]: [c[k]] });
  return createAvatar(avataaars, {
    seed: "kleff",
    backgroundColor: ["b6e3f4"],
    ...opt("top"), topProbability: c.top === "none" ? 0 : 100,
    ...opt("eyes"), ...opt("eyebrows"), ...opt("mouth"), ...opt("clothing"),
    ...opt("facialHair"), facialHairProbability: c.facialHair === "none" ? 0 : 100,
    ...opt("accessories"), accessoriesProbability: c.accessories === "none" ? 0 : 100,
    skinColor: [c.skinColor], hairColor: [c.hairColor], facialHairColor: [c.hairColor], clothesColor: [c.clothesColor], hatColor: [c.clothesColor],
  } as Parameters<typeof createAvatar>[1]).toDataUri();
}

const LABELS: Record<string, Record<"es" | "ca" | "en", string>> = {
  top: { es: "Pelo / sombrero", ca: "Cabell / barret", en: "Hair / hat" },
  eyes: { es: "Ojos", ca: "Ulls", en: "Eyes" },
  eyebrows: { es: "Cejas", ca: "Celles", en: "Eyebrows" },
  mouth: { es: "Boca / expresión", ca: "Boca / expressió", en: "Mouth / expression" },
  facialHair: { es: "Barba / bigote", ca: "Barba / bigoti", en: "Beard / moustache" },
  accessories: { es: "Gafas", ca: "Ulleres", en: "Glasses" },
  clothing: { es: "Ropa", ca: "Roba", en: "Clothes" },
  skinColor: { es: "Tono de piel", ca: "To de pell", en: "Skin tone" },
  hairColor: { es: "Color de pelo", ca: "Color de cabell", en: "Hair colour" },
  clothesColor: { es: "Color de ropa", ca: "Color de roba", en: "Clothes colour" },
};
const UI_TEXT = {
  title: { es: "Personalizar avatar", ca: "Personalitzar avatar", en: "Customise avatar" },
  none: { es: "Ninguno", ca: "Cap", en: "None" },
  random: { es: "Aleatorio", ca: "Aleatori", en: "Random" },
  save: { es: "Guardar avatar", ca: "Desar avatar", en: "Save avatar" },
};

export function AvatarEditor({ open, onOpenChange, initial, onSave, lang }: { open: boolean; onOpenChange: (o: boolean) => void; initial: AvatarConfig; onSave: (c: AvatarConfig) => void; lang: "es" | "ca" | "en" }) {
  const [cfg, setCfg] = useState(initial);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) { setPrevOpen(open); if (open) setCfg(initial); }
  const uri = useMemo(() => avatarUri(cfg), [cfg]);
  const L = (k: string) => LABELS[k]?.[lang] ?? k;
  const step = (k: OptKey, d: number) => setCfg((c) => { const a = OPTS[k] as readonly string[]; const i = a.indexOf(c[k]); return { ...c, [k]: a[(i + d + a.length) % a.length] as string }; });
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader><SheetTitle>{UI_TEXT.title[lang]}</SheetTitle></SheetHeader>
        <div className="sticky top-0 z-10 flex justify-center bg-background py-3">
          <img src={uri} alt="" className="h-28 w-28 rounded-full border-4 border-primary/20 bg-muted" />
        </div>
        <div className="space-y-3 pb-4">
          {(Object.keys(OPTS) as OptKey[]).map((k) => {
            const a = OPTS[k] as readonly string[];
            return (
              <div key={k} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                <Button type="button" size="icon" variant="ghost" aria-label={`${L(k)} −`} onClick={() => step(k, -1)}><ChevronLeft className="h-5 w-5" /></Button>
                <div className="text-center"><p className="text-sm font-medium">{L(k)}</p><p className="text-xs text-muted-foreground">{cfg[k] === "none" ? UI_TEXT.none[lang] : `${a.indexOf(cfg[k]) + 1} / ${a.length}`}</p></div>
                <Button type="button" size="icon" variant="ghost" aria-label={`${L(k)} +`} onClick={() => step(k, 1)}><ChevronRight className="h-5 w-5" /></Button>
              </div>
            );
          })}
          {(Object.keys(COLORS) as ColKey[]).map((k) => (
            <div key={k}>
              <p className="mb-1 text-sm font-medium">{L(k)}</p>
              <div className="flex flex-wrap gap-2">
                {COLORS[k].map((h) => (
                  <button key={h} type="button" aria-label={`#${h}`} onClick={() => setCfg((c) => ({ ...c, [k]: h }))}
                    className={`h-8 w-8 rounded-full border-2 ${cfg[k] === h ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                    style={{ backgroundColor: `#${h}` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 flex gap-2 bg-background py-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setCfg(randomAvatarConfig())}>{UI_TEXT.random[lang]}</Button>
          <Button type="button" className="flex-1" onClick={() => { onSave(cfg); onOpenChange(false); }}>{UI_TEXT.save[lang]}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
