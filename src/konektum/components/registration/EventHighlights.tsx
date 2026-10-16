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

/** Ficha destacada + aviso de pago + descripción plegable para formularios públicos de Konektum. */
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
    <div className="space-y-4 text-left">
      {rows.length > 0 && (
        <dl className="rounded-xl bg-muted/40 p-4 space-y-3 text-sm">
          {rows.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-lg leading-none" aria-hidden>{r.icon}</span>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</dt>
                <dd className="font-medium text-foreground first-letter:uppercase break-words whitespace-pre-line">{r.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}
      {pay.enabled && (hasPrice || pay.instructions) && pay.amountCents !== 0 && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 text-sm space-y-2">
          <p className="font-semibold text-foreground">
            💳 {isEn ? "Payment required to confirm your spot" : "Hay que pagar para confirmar tu plaza"}
            {hasPrice && `: ${price}`}
          </p>
          {pay.instructions && <p className="whitespace-pre-line text-foreground/80">{pay.instructions}</p>}
        </div>
      )}
      {description && (
        <details className="group rounded-xl border p-4 text-sm">
          <summary className="cursor-pointer font-medium text-foreground list-none flex items-center justify-between">
            {isEn ? "About the event" : "Sobre el evento"}
            <span className="text-muted-foreground group-open:rotate-180 transition-transform">⌄</span>
          </summary>
          <div className="mt-3 text-foreground/80">
            <RichTextRenderer content={description} />
          </div>
        </details>
      )}
    </div>
  );
}
