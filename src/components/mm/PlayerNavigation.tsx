import { ArrowRight, Backpack, Check, FileSearch, Gavel, Handshake, ListChecks, Lock, Map, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mmT } from "@/lib/mm/i18n";
import { CHARACTER_TABS, playerMainTabs, playerSection, votingPrompt, type PlayerTab } from "@/lib/mm/player-navigation";

type Props = {
  tab: PlayerTab;
  language: string;
  hasMap: boolean;
  votingOpen: boolean;
  hasVote: boolean;
  fresh: Record<PlayerTab, boolean>;
  onSelect: (tab: PlayerTab) => void;
};

const icons = { personaje: User, secretos: Lock, objetivos: ListChecks, inventario: Backpack, evidencias: FileSearch, mapa: Map, acciones: Handshake };
const labels = { personaje: "tab_character", secretos: "tab_secrets", objetivos: "tab_objectives", inventario: "tab_inventory", evidencias: "tab_evidence", mapa: "tab_map", acciones: "tab_actions" } as const;

function FreshDot() {
  return <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[var(--mm-primary)] motion-safe:animate-pulse" />;
}

export function CharacterNavigation({ language, fresh }: Pick<Props, "language" | "fresh">) {
  return (
    <TabsList aria-label={mmT(language, "tab_character")} className="mb-4 grid h-auto w-full grid-cols-3 gap-1 bg-[var(--mm-surface)] p-1 text-[var(--mm-text)]">
      {CHARACTER_TABS.map((id) => {
        const Icon = icons[id];
        return (
          <TabsTrigger key={id} value={id} className="min-h-11 min-w-0 gap-1.5 px-1 text-xs data-[state=active]:bg-[var(--mm-accent)] data-[state=active]:text-[var(--mm-bg)] sm:text-sm">
            <Icon aria-hidden className="h-4 w-4 shrink-0" />
            <span className="truncate">{mmT(language, id === "personaje" ? "tab_role" : labels[id])}</span>
            {fresh[id] && <FreshDot />}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

export function PlayerNavigation({ tab, language, hasMap, votingOpen, hasVote, fresh, onSelect }: Props) {
  const mainTabs = playerMainTabs(hasMap);
  const activeSection = playerSection(tab);
  const prompt = votingPrompt(votingOpen, hasVote);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--mm-accent)]/20 bg-[var(--mm-bg)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {prompt && (
        <div className="mx-auto max-w-2xl px-4 pt-2">
          {prompt === "accuse" ? (
            <Button variant="ghost" onClick={() => onSelect("acusacion")} aria-pressed={tab === "acusacion"} className="grid h-auto min-h-12 w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3 whitespace-normal border border-[var(--mm-accent)] bg-[var(--mm-primary)] px-3 py-2 text-left text-[var(--mm-text)] hover:bg-[var(--mm-primary)]/90 hover:text-[var(--mm-text)]">
              <Gavel aria-hidden className="!h-5 !w-5 text-[var(--mm-accent)]" />
              <span className="min-w-0 break-words font-semibold">{mmT(language, "accuse_now")}</span>
              <ArrowRight aria-hidden className="!h-5 !w-5" />
            </Button>
          ) : (
            <div role="status" className="flex min-h-8 items-center justify-center gap-2 text-xs text-[var(--mm-accent)]">
              <Check aria-hidden className="h-4 w-4 shrink-0" />
              <span>{mmT(language, "vote_recorded_short")}</span>
            </div>
          )}
        </div>
      )}
      <nav aria-label={mmT(language, "player_navigation")} className={`mx-auto grid max-w-2xl ${hasMap ? "grid-cols-5" : "grid-cols-4"}`}>
        {mainTabs.map((id) => {
          const Icon = icons[id];
          const hasFresh = id === "personaje" ? CHARACTER_TABS.some((child) => fresh[child]) : fresh[id];
          const active = activeSection === id;
          return (
            <Button key={id} variant="ghost" aria-pressed={active} onClick={() => onSelect(id)} className={`relative h-[4.5rem] min-w-0 flex-col gap-1 rounded-none px-1 py-2 text-[11px] hover:bg-[var(--mm-surface)] hover:text-[var(--mm-accent)] sm:text-xs ${active ? "bg-[var(--mm-surface)] text-[var(--mm-accent)]" : "text-[var(--mm-text)]/75"}`}>
              <Icon aria-hidden className="!h-6 !w-6" />
              <span className="max-w-full truncate">{mmT(language, labels[id])}</span>
              {hasFresh && <span className="absolute right-1/4 top-2"><FreshDot /></span>}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}