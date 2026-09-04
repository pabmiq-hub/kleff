// @ts-nocheck
import { Checkbox } from "@/konektum/ui/checkbox";
import { Link } from "@/konektum/router";

interface GDPRConsentProps {
  lang: "es" | "en";
  dataConsent: boolean;
  marketingConsent: boolean;
  onDataConsentChange: (checked: boolean) => void;
  onMarketingConsentChange: (checked: boolean) => void;
  /** Highlights the mandatory consent when the user tried to submit without it */
  error?: boolean;
}

const GDPRConsent = ({
  lang,
  dataConsent,
  marketingConsent,
  onDataConsentChange,
  onMarketingConsentChange,
  error,
}: GDPRConsentProps) => {
  const isEs = lang === "es";

  return (
    <div className="space-y-3 pt-2 border-t">
      {/* Mandatory: data processing consent */}
      <div data-field-error={error ? "true" : undefined}>
      <label
        className={`flex items-start gap-3 cursor-pointer ${
          error ? "rounded-lg border border-destructive/50 bg-destructive/5 p-3" : ""
        }`}
      >
        <Checkbox
          checked={dataConsent}
          onCheckedChange={(v) => onDataConsentChange(!!v)}
          className={`mt-0.5 ${error ? "border-destructive" : ""}`}
        />
        <span className="text-xs text-muted-foreground leading-relaxed">
          {isEs ? (
            <>
              He leído y acepto la{" "}
              <Link to="/politica-privacidad" target="_blank" className="underline text-primary hover:text-primary/80">
                Política de Privacidad
              </Link>
              . Consiento el tratamiento de mis datos personales para la gestión y organización del evento, incluyendo la comunicación de resultados y asignaciones de mesas.{" "}
              <span className="text-destructive font-medium">*</span>
            </>
          ) : (
            <>
              I have read and accept the{" "}
              <Link to="/politica-privacidad" target="_blank" className="underline text-primary hover:text-primary/80">
                Privacy Policy
              </Link>
              . I consent to the processing of my personal data for the management and organization of the event, including the communication of results and table assignments.{" "}
              <span className="text-destructive font-medium">*</span>
            </>
          )}
        </span>
      </label>
      {error && (
        <p className="text-xs font-medium text-destructive mt-1">
          {isEs
            ? "Debes aceptar la política de privacidad para continuar"
            : "You must accept the privacy policy to continue"}
        </p>
      )}
      </div>


      {/* Optional: marketing consent */}
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={marketingConsent}
          onCheckedChange={(v) => onMarketingConsentChange(!!v)}
          className="mt-0.5"
        />
        <span className="text-xs text-muted-foreground leading-relaxed">
          {isEs
            ? "Acepto recibir comunicaciones comerciales sobre futuros eventos y novedades. Puedo darme de baja en cualquier momento."
            : "I agree to receive promotional communications about future events and updates. I can unsubscribe at any time."}
        </span>
      </label>
    </div>
  );
};

export default GDPRConsent;
