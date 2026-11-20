import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { retosPublicEvent, retosJoin, retosRecover, retosDashboard, retosComplete, retosConfirm, retosMessages, retosSendMessage } from "@/lib/retos.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Camera, Check, Clock, Instagram, MessageCircle, Send, Shuffle, Target, Ticket, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/retos/$slug")({
  loader: ({ params }) => retosPublicEvent({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.title} · Misiones KLEFF` : "Misiones · KLEFF";
    const desc = "Completa misiones durante el evento de KLEFF y consigue números para el sorteo.";
    return { meta: [
      { title: t }, { name: "description", content: desc },
      { property: "og:title", content: t }, { property: "og:description", content: desc },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: loaderData?.cover_url ? "summary_large_image" : "summary" },
      ...(loaderData?.cover_url?.startsWith("https://") ? [{ property: "og:image", content: loaderData.cover_url }, { name: "twitter:image", content: loaderData.cover_url }] : []),
      { name: "robots", content: "noindex" },
    ] };
  },
  component: RetoPage,
});

const err = (e: unknown) => toast.error((e as Error).message);
type Dash = Awaited<ReturnType<typeof retosDashboard>>;

function RetoPage() {
  const ev = Route.useLoaderData();
  const { slug } = Route.useParams();
  const key = `kleff-reto-${slug}`;
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => { setToken(localStorage.getItem(key)); }, [key]);
  const save = (t: string | null) => { if (t) localStorage.setItem(key, t); else localStorage.removeItem(key); setToken(t); };
  if (!ev) return <Shell><div className="grid min-h-[60vh] place-items-center p-6 text-center text-muted-foreground">Este reto no existe o aún no está publicado.</div></Shell>;
  if (token === undefined) return <Shell><div className="p-6 text-center text-muted-foreground">Cargando…</div></Shell>;
  return <Shell>{token ? <Dashboard token={token} onLogout={() => save(null)} /> : <Welcome ev={ev} slug={slug} onToken={save} />}</Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-[100dvh] w-full max-w-md bg-background">{children}</div>;
}

// ---------- Bienvenida / registro ----------
async function compressImage(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 256, 256);
  return c.toDataURL("image/jpeg", 0.8);
}

function Welcome({ ev, slug, onToken }: { ev: NonNullable<ReturnType<typeof Route.useLoaderData>>; slug: string; onToken: (t: string) => void }) {
  const join = useServerFn(retosJoin);
  const recover = useServerFn(retosRecover);
  const [step, setStep] = useState<"ask" | "member" | "create" | "recover" | "code">("ask");
  const [nickname, setNickname] = useState("");
  const [seed, setSeed] = useState("kleff");
  const [photo, setPhoto] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [created, setCreated] = useState<{ token: string; code: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setSeed(Math.random().toString(36).slice(2)); }, []);
  const generated = useMemo(() => createAvatar(avataaars, { seed }).toDataUri(), [seed]);
  const avatar = photo ?? generated;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {ev.cover_url ? <img src={ev.cover_url} alt="" className="aspect-video w-full object-cover" /> : <div className="grid aspect-[3/1] place-items-center bg-primary/10"><Target className="h-10 w-10 text-primary" /></div>}
      <div className="flex-1 space-y-5 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Misiones KLEFF</p>
          <h1 className="font-display text-3xl leading-tight">{ev.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ev.event_date && new Date(ev.event_date).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}
            {ev.location && `${ev.event_date ? " · " : ""}${ev.location}`}
          </p>
        </div>
        {!ev.open && <p className="rounded-lg bg-muted p-3 text-sm">Este reto está cerrado.</p>}

        {step === "ask" && ev.open && (
          <div className="space-y-3">
            <p className="text-base">Cumple misiones durante el evento y gana números para el sorteo. ¿Eres socio de KLEFF?</p>
            <Button className="h-12 w-full text-base" onClick={() => setStep("create")}>No, crear mi perfil</Button>
            <Button className="h-12 w-full text-base" variant="outline" onClick={() => setStep("member")}>Sí, soy socio</Button>
            <button className="w-full py-2 text-sm text-muted-foreground underline" onClick={() => setStep("recover")}>Ya tengo perfil en este reto</button>
          </div>
        )}
        {step === "member" && (
          <div className="space-y-3">
            <p className="rounded-lg bg-muted p-4 text-sm">Muy pronto podrás entrar con tu cuenta de socio. De momento, crea un perfil rápido con un pseudónimo: solo te llevará un momento.</p>
            <Button className="h-12 w-full" onClick={() => setStep("create")}>Crear perfil</Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("ask")}>Volver</Button>
          </div>
        )}
        {step === "create" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <img src={avatar} alt="Tu avatar" className="h-28 w-28 rounded-full border-4 border-primary/20 bg-muted object-cover" />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setPhoto(null); setSeed(Math.random().toString(36).slice(2)); }}><Shuffle className="mr-1 h-4 w-4" />Otro avatar</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Camera className="mr-1 h-4 w-4" />Mi foto</Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setPhoto(await compressImage(f)); } catch { toast.error("No se ha podido leer la imagen."); } } }} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="nick">Pseudónimo</label>
              <Input id="nick" className="h-12 text-base" maxLength={30} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ej. MeepleVeloz" />
              <p className="mt-1 text-xs text-muted-foreground">No pedimos tu nombre, correo ni teléfono.</p>
            </div>
            <Button className="h-12 w-full text-base" disabled={busy || nickname.trim().length < 2} onClick={async () => {
              setBusy(true);
              try { const r = await join({ data: { slug, nickname, avatar } }); setCreated({ token: r.token, code: r.accessCode }); setStep("code"); } catch (e) { err(e); } finally { setBusy(false); }
            }}>Entrar</Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("ask")}>Volver</Button>
          </div>
        )}
        {step === "code" && created && (
          <div className="space-y-4 text-center">
            <p className="text-sm">Guarda tu código. Lo necesitarás si cambias de móvil o se borra el navegador.</p>
            <div className="rounded-xl border-2 border-dashed border-primary p-4 font-mono text-3xl tracking-[0.3em]">{created.code}</div>
            <Button variant="outline" className="w-full" onClick={() => { void navigator.clipboard?.writeText(created.code); toast.success("Código copiado"); }}>Copiar código</Button>
            <Button className="h-12 w-full text-base" onClick={() => onToken(created.token)}>Empezar misiones</Button>
          </div>
        )}
        {step === "recover" && (
          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="code">Tu código de acceso</label>
            <Input id="code" className="h-12 text-center font-mono text-xl uppercase tracking-widest" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC234" />
            <Button className="h-12 w-full" disabled={busy || code.trim().length < 4} onClick={async () => { setBusy(true); try { const r = await recover({ data: { slug, code } }); onToken(r.token); } catch (e) { err(e); } finally { setBusy(false); } }}>Entrar</Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("ask")}>Volver</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Panel del participante ----------
type Tab = "misiones" | "personas" | "mensajes" | "numeros";

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const fetchDash = useServerFn(retosDashboard);
  const [d, setD] = useState<Dash | null>(null);
  const [tab, setTab] = useState<Tab>("misiones");
  const [chat, setChat] = useState<string | null>(null);
  const load = useCallback(() => fetchDash({ data: { token } }).then(setD).catch((e) => { err(e); if (/caducado/.test((e as Error).message)) onLogout(); }), [fetchDash, token, onLogout]);
  useEffect(() => { void load(); const iv = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 10000); return () => clearInterval(iv); }, [load]);
  if (!d) return <div className="p-6 text-center text-muted-foreground">Cargando…</div>;
  const unread = d.participants.reduce((s, p) => s + p.unread, 0);
  const people = new Map(d.participants.map((p) => [p.id, p]));
  const openChat = (id: string) => { setChat(id); setTab("mensajes"); };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <img src={d.me.avatar_url ?? ""} alt="" className="h-10 w-10 rounded-full bg-muted object-cover" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{d.me.nickname}</div>
          <div className="truncate text-xs text-muted-foreground">{d.event.title} · código {d.me.access_code}</div>
        </div>
        <Badge className="shrink-0"><Ticket className="mr-1 h-3 w-3" />{d.tickets.length}</Badge>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        {d.toConfirm.length > 0 && tab !== "mensajes" && <ConfirmList d={d} token={token} reload={load} people={people} />}
        {tab === "misiones" && <MissionsTab d={d} token={token} reload={load} />}
        {tab === "personas" && <PeopleTab d={d} onMessage={openChat} />}
        {tab === "mensajes" && <MessagesTab d={d} token={token} chat={chat} setChat={setChat} reload={load} people={people} />}
        {tab === "numeros" && <NumbersTab d={d} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-md grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)]">
        {([
          ["misiones", "Misiones", Target, d.toConfirm.length],
          ["personas", "Personas", Users, 0],
          ["mensajes", "Mensajes", MessageCircle, unread],
          ["numeros", "Sorteo", Trophy, d.draws.filter((x) => x.mine).length],
        ] as const).map(([k, label, Icon, n]) => (
          <button key={k} onClick={() => { setTab(k); if (k !== "mensajes") setChat(null); }} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs ${tab === k ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />{label}
            {n > 0 && <span className="absolute right-1/4 top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">{n}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}

function ConfirmList({ d, token, reload, people }: { d: Dash; token: string; reload: () => void; people: Map<string, Dash["participants"][number]> }) {
  const confirm = useServerFn(retosConfirm);
  return (
    <div className="mb-4 space-y-2">
      {d.toConfirm.map((c) => (
        <div key={c.id} className="rounded-xl border-2 border-primary bg-primary/5 p-3">
          <p className="text-sm"><strong>{people.get(c.from)?.nickname}</strong> dice que ha cumplido contigo esta misión:</p>
          <p className="mt-1 text-sm italic">«{c.title}»</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={async () => { try { await confirm({ data: { token, completionId: c.id, accept: false } }); reload(); } catch (e) { err(e); } }}>No es verdad</Button>
            <Button onClick={async () => { try { await confirm({ data: { token, completionId: c.id, accept: true } }); toast.success("¡Confirmada!"); reload(); } catch (e) { err(e); } }}><Check className="mr-1 h-4 w-4" />Confirmar</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

type M = Dash["missions"][number];
function MissionsTab({ d, token, reload }: { d: Dash; token: string; reload: () => void }) {
  const complete = useServerFn(retosComplete);
  const [active, setActive] = useState<M | null>(null);
  const [partners, setPartners] = useState<string[]>([]);
  const [evidence, setEvidence] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const others = d.participants.filter((p) => p.id !== d.me.id && p.nickname.toLowerCase().includes(q.toLowerCase()));
  const conn = d.missions.filter((m) => m.category === "conexion");
  const social = d.missions.filter((m) => m.category === "social");
  const open = (m: M) => { setActive(m); setPartners([]); setEvidence(""); setQ(""); };
  const needsPartners = active && (active.category === "conexion" || active.kind === "ludoya");
  const single = active?.category === "conexion";
  const needsIg = active && ["follow", "post", "story"].includes(active.kind);
  const accounts = d.event.social_accounts.map((a) => `@${a}`).join(", ");

  const card = (m: M, secret: boolean) => (
    <div key={m.id} className={`rounded-xl border p-4 ${m.status === "confirmed" ? "border-primary/40 bg-primary/5" : "bg-card"}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug">{m.title}{["follow", "post", "story"].includes(m.kind) && <span className="text-muted-foreground"> ({accounts})</span>}</p>
          <p className="mt-1 text-xs text-muted-foreground"><Ticket className="mr-1 inline h-3 w-3" />{m.tickets} {m.tickets === 1 ? "número" : "números"}{secret && " · secreta"}</p>
        </div>
        {m.status === "confirmed" && <Badge className="shrink-0"><Check className="mr-1 h-3 w-3" />Hecha</Badge>}
        {m.status === "pending" && <Badge variant="secondary" className="shrink-0"><Clock className="mr-1 h-3 w-3" />Pendiente</Badge>}
      </div>
      {m.status === "todo" && d.event.open && <Button className="mt-3 h-11 w-full" variant={secret ? "default" : "outline"} onClick={() => open(m)}>{m.kind === "follow" ? "Ya os sigo" : m.kind === "ludoya" ? "Registrar partida" : secret ? "¡Lo he conseguido!" : "Hecho"}</Button>}
    </div>
  );

  return (
    <div className="space-y-6">
      {!d.event.open && <p className="rounded-lg bg-muted p-3 text-sm">El reto está cerrado: ya no se pueden enviar misiones.</p>}
      <section className="space-y-3">
        <div><h2 className="font-display text-xl">Tus misiones secretas</h2><p className="text-xs text-muted-foreground">No las enseñes hasta cumplirlas. La otra persona tendrá que confirmarlo.</p></div>
        {conn.map((m) => card(m, true))}
        {!conn.length && <p className="text-sm text-muted-foreground">No tienes misiones de conexión.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-xl">Misiones sociales</h2>
        {social.map((m) => card(m, false))}
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className="pr-6 text-left text-base leading-snug">{active?.title}</DialogTitle></DialogHeader>
          {needsIg && (
            <div className="space-y-3">
              {active?.kind === "follow" && d.event.social_accounts.map((a) => (
                <a key={a} href={`https://instagram.com/${a}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border p-3 text-sm"><Instagram className="h-4 w-4" />Abrir @{a}</a>
              ))}
              <label className="text-sm font-medium" htmlFor="ig">Tu usuario de Instagram</label>
              <Input id="ig" className="h-11" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="@tuusuario" />
              <p className="text-xs text-muted-foreground">Lo comprobaremos antes de entregar un premio.</p>
            </div>
          )}
          {active?.kind === "ludoya" && (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="game">¿Qué partida has registrado?</label>
              <Input id="game" className="h-11" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Ej. Catan" />
            </div>
          )}
          {needsPartners && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{single ? "¿Con quién lo has conseguido?" : "¿Con quién has jugado?"}</p>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pseudónimo" />
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {others.map((p) => {
                  const on = partners.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => setPartners(single ? [p.id] : on ? partners.filter((x) => x !== p.id) : [...partners, p.id])} className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left ${on ? "border-primary bg-primary/10" : ""}`}>
                      <img src={p.avatar_url ?? ""} alt="" className="h-9 w-9 rounded-full bg-muted object-cover" />
                      <span className="flex-1">{p.nickname}</span>{on && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
                {!others.length && <p className="text-sm text-muted-foreground">No hay nadie más con ese nombre.</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="h-11 w-full" disabled={busy || (!!needsPartners && !partners.length) || ((needsIg || active?.kind === "ludoya") && !evidence.trim())} onClick={async () => {
              if (!active) return;
              setBusy(true);
              try {
                const r = await complete({ data: { token, missionId: active.id, partnerIds: partners, evidence: evidence || undefined } });
                toast.success(r.status === "confirmed" ? "¡Misión completada!" : "Enviada. Falta que la otra persona la confirme.");
                setActive(null); reload();
              } catch (e) { err(e); } finally { setBusy(false); }
            }}>{single ? "Pedir confirmación" : "Enviar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PeopleTab({ d, onMessage }: { d: Dash; onMessage: (id: string) => void }) {
  const [q, setQ] = useState("");
  const list = d.participants.filter((p) => p.id !== d.me.id && p.nickname.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl">Participantes ({d.participants.length})</h2>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pseudónimo" className="h-11" />
      <div className="grid grid-cols-2 gap-3">
        {list.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center">
            <img src={p.avatar_url ?? ""} alt="" className="h-16 w-16 rounded-full bg-muted object-cover" />
            <div className="w-full truncate text-sm font-medium">{p.nickname}</div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => onMessage(p.id)}><MessageCircle className="mr-1 h-4 w-4" />Mensaje</Button>
          </div>
        ))}
      </div>
      {!list.length && <p className="text-sm text-muted-foreground">Todavía no hay nadie más.</p>}
    </div>
  );
}

function MessagesTab({ d, token, chat, setChat, reload, people }: { d: Dash; token: string; chat: string | null; setChat: (id: string | null) => void; reload: () => void; people: Map<string, Dash["participants"][number]> }) {
  const fetchMsgs = useServerFn(retosMessages);
  const send = useServerFn(retosSendMessage);
  const [msgs, setMsgs] = useState<Awaited<ReturnType<typeof retosMessages>>>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const load = useCallback(() => { if (chat) fetchMsgs({ data: { token, withId: chat } }).then(setMsgs).catch(err); }, [chat, fetchMsgs, token]);
  useEffect(() => { setMsgs([]); load(); if (!chat) return; const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [chat, load]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  if (!chat) {
    const withUnread = d.participants.filter((p) => p.id !== d.me.id).sort((a, b) => b.unread - a.unread);
    return (
      <div className="space-y-3">
        <h2 className="font-display text-xl">Mensajes</h2>
        <div className="divide-y rounded-xl border bg-card">
          {withUnread.map((p) => (
            <button key={p.id} onClick={() => setChat(p.id)} className="flex w-full items-center gap-3 p-3 text-left">
              <img src={p.avatar_url ?? ""} alt="" className="h-10 w-10 rounded-full bg-muted object-cover" />
              <span className={`flex-1 ${p.unread ? "font-semibold" : ""}`}>{p.nickname}</span>
              {p.unread > 0 && <Badge>{p.unread}</Badge>}
            </button>
          ))}
          {!withUnread.length && <p className="p-4 text-sm text-muted-foreground">Todavía no hay nadie con quien hablar.</p>}
        </div>
      </div>
    );
  }
  const other = people.get(chat);
  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col">
      <div className="mb-2 flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={() => { setChat(null); reload(); }}><ArrowLeft className="h-5 w-5" /></Button>
        <img src={other?.avatar_url ?? ""} alt="" className="h-8 w-8 rounded-full bg-muted object-cover" />
        <span className="font-medium">{other?.nickname}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto rounded-xl bg-muted/40 p-3">
        {msgs.map((m) => (
          <div key={m.id} className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${m.mine ? "ml-auto bg-primary text-primary-foreground" : "bg-card"}`}>{m.body}</div>
        ))}
        {!msgs.length && <p className="text-center text-sm text-muted-foreground">Escribe el primer mensaje.</p>}
        <div ref={endRef} />
      </div>
      <form className="mt-2 flex gap-2" onSubmit={async (e) => { e.preventDefault(); const body = text.trim(); if (!body) return; setText(""); try { await send({ data: { token, toId: chat, body } }); load(); } catch (x) { err(x); setText(body); } }}>
        <Input className="h-11" value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensaje…" maxLength={1000} />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label="Enviar"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}

function NumbersTab({ d }: { d: Dash }) {
  const won = d.draws.filter((x) => x.mine);
  return (
    <div className="space-y-5">
      {won.map((w) => (
        <div key={w.id} className="rounded-xl border-2 border-primary bg-primary/10 p-4 text-center">
          <Trophy className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-1 font-display text-2xl">¡Te ha tocado!</p>
          <p className="text-sm">Número #{w.number}{w.prize ? ` · ${w.prize}` : ""}</p>
        </div>
      ))}
      <section>
        <h2 className="font-display text-xl">Tus números ({d.tickets.length})</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {d.tickets.map((t) => <div key={t.number} className="rounded-lg border bg-card py-3 text-center font-mono text-lg">#{t.number}</div>)}
        </div>
        {!d.tickets.length && <p className="mt-2 text-sm text-muted-foreground">Cumple misiones para conseguir números.</p>}
      </section>
      {d.draws.length > 0 && (
        <section>
          <h2 className="font-display text-xl">Números premiados</h2>
          <div className="mt-2 divide-y rounded-xl border bg-card">
            {d.draws.map((w) => <div key={w.id} className="flex justify-between p-3 text-sm"><span className="font-mono">#{w.number}</span><span className="text-muted-foreground">{w.prize ?? "Premio"}</span></div>)}
          </div>
        </section>
      )}
    </div>
  );
}
