import { useState } from "react";
import { Wallet, Send, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { MMItemArt } from "./shared";

export function Interactions({ state, run, readOnly, inventory = false }: { state: any; run?: (data: any) => Promise<void>; readOnly?: boolean; inventory?: boolean }) {
  const [proposal, setProposal] = useState<any>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [amount, setAmount] = useState(1);
  const [busy, setBusy] = useState(false);
  const active = state.session.status === "running" && !readOnly;
  const people = state.cast.filter((p: any) => p.player && p.player.id !== state.me.id);
  const open = (p: any) => { setProposal(p); setTargets([]); setAmount(1); };
  const execute = async (data: any) => {
    setBusy(true);
    try { await run?.(data); setProposal(null); } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  const label = (id: string) => state.cast.find((c: any) => c.player?.id === id)?.name ?? "Participante";
  return <div className="space-y-4">
    {inventory && <>
      {state.wallet && <section className="border-b border-border pb-4">
        <p className="flex items-center gap-2 text-sm"><Wallet className="h-5 w-5" />Dinero ficticio</p>
        <p className="my-3 text-3xl font-semibold tabular-nums">{state.wallet.amount} {state.wallet.currency}</p>
        <Button disabled={!active || busy || state.wallet.amount < 1} onClick={() => open({ kind: "money", name: "Pagar", count: 2 })}><Send />Pagar</Button>
      </section>}
      {(state.items ?? []).map((i: any) => <article key={i.id} className="rounded-lg bg-card p-4 text-card-foreground">
        <div className="flex gap-3"><MMItemArt item={i} /><div className="min-w-0"><h3 className="font-semibold">{i.name}</h3><p className="mt-1 text-sm">{i.description}</p></div></div>
        <Button className="mt-3" size="sm" variant="outline" disabled={!active || busy} onClick={() => open({ kind: "item", sourceId: i.id, name: i.name, count: 2 })}><Send />Entregar</Button>
      </article>)}
      {(state.abilities ?? []).map((a: any) => <article key={a.id} className="rounded-lg bg-card p-4 text-card-foreground">
        <h3 className="font-semibold">{a.name} · {a.uses_left}/{a.max_uses}</h3><p className="mt-1 text-sm">{a.description}</p>
        <Button className="mt-3" size="sm" variant="outline" disabled={!active || busy || a.uses_left < 1} onClick={() => open({ kind: "ability", sourceId: a.id, name: a.name, count: 2 })}><Send />Usar</Button>
      </article>)}
      {(state.fragments ?? []).map((f: any) => <article key={f.id} className="rounded-lg bg-card p-4 text-card-foreground"><h3 className="font-semibold">{f.label}</h3><p className="mt-1 whitespace-pre-wrap text-sm">{f.value}</p></article>)}
    </>}
    {!inventory && <>
      {(state.joint_actions ?? []).map((j: any) => <article key={j.id} className="rounded-lg bg-card p-4 text-card-foreground">
        <h3 className="font-semibold">{j.name}</h3><p className="mt-1 text-sm">{j.description}</p>
        <Button className="mt-3" disabled={!active || busy} onClick={() => open({ kind: "joint", sourceId: j.id, name: j.name, count: j.count })}><Send />Proponer</Button>
      </article>)}
      {(state.requests ?? []).length === 0 && <p className="text-sm opacity-70">Sin propuestas.</p>}
    </>}
    {(state.requests ?? []).filter((r: any) => !inventory || ["money", "item", "ability"].includes(r.kind)).map((r: any) => <article key={r.id} className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <h3 className="font-semibold">{r.title}{r.amount ? ` · ${r.amount} EUR` : ""}</h3>
      <p className="mt-1 text-sm">{label(r.from_player)} → {r.to_players.map(label).join(", ")}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm">{r.proposal_text}</p>
      <p className="mt-2 text-xs text-muted-foreground">{({ pending: "Pendiente de aceptación", completed: "Completada", rejected: "Rechazada", expired: "Caducada" } as Record<string, string>)[r.status] ?? r.status}</p>
      {r.results.map((text: string, i: number) => <p key={i} className="mt-3 whitespace-pre-wrap text-sm">{text}</p>)}
      {r.status === "pending" && active && <div className="mt-3 flex flex-wrap gap-2">
        {r.from_player === state.me.id ? <Button size="sm" variant="outline" disabled={busy} onClick={() => execute({ kind: "cancel", requestId: r.id })}><X />Cancelar</Button> : <>
          <Button size="sm" disabled={busy || r.accepted.includes(state.me.id)} onClick={() => execute({ kind: "respond", requestId: r.id, accept: true })}><Check />{r.accepted.includes(state.me.id) ? "Aceptada por ti" : "Aceptar"}</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => execute({ kind: "respond", requestId: r.id, accept: false })}><X />Rechazar</Button>
        </>}
      </div>}
    </article>)}
    <Dialog open={!!proposal} onOpenChange={v => !v && !busy && setProposal(null)}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>{proposal?.name}</DialogTitle></DialogHeader>
        <fieldset className="space-y-3"><legend className="mb-3 text-sm">Participantes · {targets.length}/{Math.max(0, (proposal?.count ?? 2) - 1)}</legend>
          {people.map((c: any) => <label key={c.player.id} className="flex items-center gap-3 text-sm"><Checkbox checked={targets.includes(c.player.id)} onCheckedChange={checked => setTargets(checked ? [...targets, c.player.id] : targets.filter(id => id !== c.player.id))} />{c.name} · {c.player.display_name}</label>)}
        </fieldset>
        {proposal?.kind === "money" && <label className="space-y-2 text-sm">Cantidad (EUR)<Input aria-label="Cantidad" type="number" min={1} max={state.wallet?.amount} step={1} value={amount} onChange={e => setAmount(Number(e.target.value))} /></label>}
        <Button disabled={busy || !active || targets.length !== (proposal?.count ?? 2) - 1 || (proposal?.kind === "money" && (!Number.isInteger(amount) || amount < 1 || amount > state.wallet.amount))} onClick={() => execute({ kind: proposal.kind, sourceId: proposal.sourceId, targetIds: targets, ...(proposal.kind === "money" ? { amount } : {}) })}><Send />Enviar propuesta</Button>
      </DialogContent>
    </Dialog>
  </div>;
}