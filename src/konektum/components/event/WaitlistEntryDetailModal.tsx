// @ts-nocheck
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/konektum/ui/dialog";
import { Badge } from "@/konektum/ui/badge";
import {
  User, Mail, Phone, Calendar, Heart, Users, Cake, Languages, RotateCcw, Megaphone,
  Sparkles, Gamepad2, Target, Building2, Briefcase, ListOrdered,
} from "lucide-react";
import { DEFAULT_WRAPPED_QUESTIONS } from "@/konektum/lib/wrappedQuestions";
import { DEFAULT_SOCIAL_GAME_QUESTIONS } from "@/konektum/lib/socialGame";
import { normalizeIcebreakers } from "@/konektum/lib/icebreakers";

interface WaitlistEntry {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  age_range?: string | null;
  preference?: string | null;
  dating_preference?: string | null;
  preferred_age_range?: string | null;
  is_returning_participant?: boolean | null;
  marketing_consent?: boolean | null;
  entity_type?: string | null;
  company_name?: string | null;
  sector?: string | null;
  company_size?: string | null;
  needs?: string[] | null;
  solutions?: string[] | null;
  position?: number | null;
  created_at?: string | null;
  wrapped_answers?: unknown;
  game_answers?: unknown;
}

interface Props {
  entry: WaitlistEntry;
  onClose: () => void;
  socialGame?: unknown;
  isProfessional?: boolean;
}

const Row = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
    <Icon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground break-words">{label}</p>
      <div className="font-medium text-sm break-words">{value}</div>
    </div>
  </div>
);

const WaitlistEntryDetailModal = ({ entry, onClose, socialGame, isProfessional = false }: Props) => {
  const wrappedAnswers = (entry.wrapped_answers && typeof entry.wrapped_answers === "object"
    ? (entry.wrapped_answers as Record<string, unknown>)
    : null);

  const questionLabelEs: Record<string, string> = {};
  const optionLabelEs: Record<string, Record<string, string>> = {};
  for (const q of DEFAULT_WRAPPED_QUESTIONS) {
    questionLabelEs[q.id] = q.i18n.es.label;
    if (q.options_key && q.i18n.es.options) {
      optionLabelEs[q.id] = {};
      q.options_key.forEach((k, i) => {
        optionLabelEs[q.id][k] = q.i18n.es.options![i] || k;
      });
    }
    if (q.type === "yes_no") {
      optionLabelEs[q.id] = { true: "Sí", false: "No" };
    }
  }
  const translateOption = (qid: string, val: unknown): string =>
    optionLabelEs[qid]?.[String(val)] ?? String(val);

  const gameCfg = normalizeIcebreakers(socialGame).games.who_is_who;
  const gameLabels: Record<string, string> = {};
  for (const q of [...gameCfg.questions, ...DEFAULT_SOCIAL_GAME_QUESTIONS]) {
    if (!gameLabels[q.id]) gameLabels[q.id] = q.label_es || q.id;
  }
  const gameEntries = entry.game_answers && typeof entry.game_answers === "object"
    ? Object.entries(entry.game_answers as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    : [];

  const birthDate = entry.birth_date ? new Date(`${entry.birth_date}T12:00:00`) : null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            {entry.name}
          </DialogTitle>
          <DialogDescription>
            Respuestas del formulario de inscripción (lista de espera)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {entry.email && <Row icon={Mail} label="Email" value={entry.email} />}
            {entry.phone && <Row icon={Phone} label="Teléfono" value={entry.phone} />}
            {entry.gender && <Row icon={User} label="Género" value={entry.gender} />}
            {birthDate && !isNaN(birthDate.getTime()) && (
              <Row
                icon={Cake}
                label="Fecha de nacimiento"
                value={birthDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
              />
            )}
            {entry.age_range && <Row icon={Users} label="Rango de edad" value={entry.age_range} />}
            {entry.preference && <Row icon={Heart} label="Preferencia" value={entry.preference} />}
            {entry.dating_preference && <Row icon={Heart} label="Preferencia romántica" value={entry.dating_preference} />}
            {entry.preferred_age_range && <Row icon={Users} label="Edad preferida" value={entry.preferred_age_range} />}
            {isProfessional && entry.company_name && <Row icon={Building2} label="Empresa" value={entry.company_name} />}
            {isProfessional && entry.entity_type && (
              <Row icon={Briefcase} label="Tipo" value={entry.entity_type === "client" ? "Cliente" : "Proveedor"} />
            )}
            {isProfessional && entry.sector && <Row icon={Briefcase} label="Sector" value={entry.sector} />}
            {isProfessional && entry.company_size && <Row icon={Building2} label="Tamaño" value={entry.company_size} />}
            {entry.is_returning_participant != null && (
              <Row icon={RotateCcw} label="Participante recurrente" value={entry.is_returning_participant ? "Sí" : "No"} />
            )}
            {entry.marketing_consent != null && (
              <Row icon={Megaphone} label="Consentimiento marketing" value={entry.marketing_consent ? "Aceptado" : "No aceptado"} />
            )}
            {entry.created_at && (
              <Row
                icon={Calendar}
                label="Fecha de solicitud"
                value={new Date(entry.created_at).toLocaleString("es-ES")}
              />
            )}
          </div>

          {isProfessional && ((entry.needs?.length ?? 0) > 0 || (entry.solutions?.length ?? 0) > 0) && (
            <div className="border-t pt-3 grid gap-3">
              {(entry.needs?.length ?? 0) > 0 && (
                <Row
                  icon={Target}
                  label="Necesidades"
                  value={<div className="flex flex-wrap gap-1 mt-1">{entry.needs!.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n}</Badge>)}</div>}
                />
              )}
              {(entry.solutions?.length ?? 0) > 0 && (
                <Row
                  icon={Sparkles}
                  label="Soluciones"
                  value={<div className="flex flex-wrap gap-1 mt-1">{entry.solutions!.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n}</Badge>)}</div>}
                />
              )}
            </div>
          )}

          {wrappedAnswers && Object.keys(wrappedAnswers).length > 0 && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Intereses (Wrapped)
              </p>
              <div className="grid gap-3">
                {Object.entries(wrappedAnswers).map(([k, v]) => {
                  const label = questionLabelEs[k] || k;
                  let node: React.ReactNode;
                  if (v === null || v === undefined) {
                    node = <p className="font-medium text-sm">—</p>;
                  } else if (Array.isArray(v)) {
                    node = (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(v as unknown[]).map((it, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {k === "top_hobbies" ? `#${i + 1} ` : ""}{translateOption(k, it)}
                          </Badge>
                        ))}
                      </div>
                    );
                  } else if (typeof v === "object") {
                    const obj = v as { top1?: string; top2?: string; top3?: string };
                    const items = [obj.top1, obj.top2, obj.top3].filter(Boolean) as string[];
                    node = (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {items.map((it, i) => (
                          <Badge key={i} variant="outline" className="text-xs">#{i + 1} {translateOption(k, it)}</Badge>
                        ))}
                      </div>
                    );
                  } else if (typeof v === "boolean") {
                    node = <p className="font-medium text-sm">{v ? "Sí" : "No"}</p>;
                  } else {
                    node = <p className="font-medium text-sm">{translateOption(k, v)}</p>;
                  }
                  return <Row key={k} icon={Target} label={label} value={node} />;
                })}
              </div>
            </div>
          )}

          {gameEntries.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-primary" /> Juego «¿Quién es quién?»
              </p>
              <div className="grid gap-3">
                {gameEntries.map(([k, v]) => (
                  <Row
                    key={k}
                    icon={Gamepad2}
                    label={gameLabels[k] || k}
                    value={<p className="font-medium text-sm whitespace-pre-wrap">{String(v)}</p>}
                  />
                ))}
              </div>
            </div>
          )}

          {!wrappedAnswers && gameEntries.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Esta persona no completó preguntas de Wrapped ni del juego.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistEntryDetailModal;
