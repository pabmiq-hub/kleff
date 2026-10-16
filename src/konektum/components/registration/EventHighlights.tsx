// @ts-nocheck
import { RichTextRenderer } from "@/konektum/ui/rich-text-renderer";
import { normalizeHighlights } from "@/lib/registrations-content";

export type PaymentInfo = {
  enabled: boolean;
  amountCents: number | null;
  currency: string;
  instructions: string | null;
};

interface Props {
  lang: string;
  eventDate: Date | null;
  eventTime: string | null;
  eventLocation: string | null;
  paymentInfo?: PaymentInfo | null;
  highlights?: unknown;
  description?: string | null;
}

/** Ficha destacada + descripción visible + aviso de pago para formularios públicos de Konektum. */
export default function EventHighlights({ lang, eventDate, eventTime, eventLocation, paymentInfo, highlights, description }: Props) {
  const isEn = lang === "en";
  const pay = paymentInfo || { enabled: false, amountCents: null, currency: "EUR", instructions: null };
  const hasPrice = pay.enabled && pay.amountCents != null;
  const price = hasPrice ? (pay.amountCents === 0 ? (isEn ? "Free" : "Gratis") : `${(pay.amountCents / 100).toFixed(2)} ${pay.currency}`) : null;

  const rows: { icon: string; label: string; value: string }[] = [];
  if (eventDate) rows.push({ icon: "📅", label: isEn ? "Date" : "Fecha", value: eventDate.toLocaleDateString(isEn ? "en-GB" : "es-ES", { weekday: "long", day: "numeric", month: "long" }) + (eventTime ? ` · ${eventTime}` : "") });
  if (eventLocation) rows.push({ icon: "📍", label: isEn ? "Location" : "Lugar", value: eventLocation });
  if (price) rows.push({ icon: "💶", label: isEn ? "Price" : "Precio", value: price });
  for (const h of normalizeHighlights(highlights)) {
    if (h.label.trim() && h.text.trim()) rows.push({ icon: h.emoji || "•", label: h.label, value: h.text });
  }

  return (
    <div className="space-y-5 text-left">
      {rows.length > 0 && (
        <dl className="grid gap-4 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2 sm:p-5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-start gap-3 min-w-0">
              <span className="text-xl leading-none shrink-0" aria-hidden>{r.icon}</span>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</dt>
                <dd className="font-medium text-foreground first-letter:uppercase break-words whitespace-pre-line">{r.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}
      {description && (
        <div className="text-sm sm:text-base text-foreground/85 leading-relaxed">
          <RichTextRenderer content={description} />
        </div>
      )}
      {pay.enabled && (hasPrice || pay.instructions) && pay.amountCents !== 0 && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 sm:p-5 text-sm space-y-2">
          <p className="font-semibold text-foreground">
            💳 {isEn ? "Payment required to confirm your spot" : "Hay que pagar para confirmar tu plaza"}
            {hasPrice && `: ${price}`}
          </p>
          {pay.instructions && <p className="whitespace-pre-line text-foreground/80">{pay.instructions}</p>}
        </div>
      )}
    </div>
  );
}
