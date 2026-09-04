// @ts-nocheck
import { useState } from "react";
import { Button } from "@/konektum/ui/button";
import { Input } from "@/konektum/ui/input";
import { Label } from "@/konektum/ui/label";
import { Textarea } from "@/konektum/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/konektum/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/konektum/ui/select";
import { Checkbox } from "@/konektum/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { FormField } from "@/konektum/components/event/RegistrationFormEditor";
import { RichTextRenderer } from "@/konektum/ui/rich-text-renderer";
import GDPRConsent from "@/konektum/components/registration/GDPRConsent";
import { FieldError } from "@/konektum/ui/field-error";
import { errorInputClass, fieldErrorMessage, scrollToFirstError } from "@/konektum/lib/formErrors";


interface DynamicRegistrationFormProps {
  fields: FormField[];
  eventName: string;
  eventDate: Date | null;
  eventTime: string | null;
  eventLocation: string | null;
  registrationSubtitle: string | null;
  registrationDescription: string | null;
  eventLang: "es" | "en";
  isSubmitting: boolean;
  onSubmit: (values: Record<string, any>) => void;
}

const DynamicRegistrationForm = ({
  fields,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  registrationSubtitle,
  registrationDescription,
  eventLang,
  isSubmitting,
  onSubmit,
}: DynamicRegistrationFormProps) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [dataConsent, setDataConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [consentError, setConsentError] = useState(false);


  const setValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => prev.filter((id) => id !== fieldId));
  };

  const toggleMultiSelect = (fieldId: string, option: string) => {
    const current = (values[fieldId] as string[]) || [];
    setValue(
      fieldId,
      current.includes(option)
        ? current.filter((v: string) => v !== option)
        : [...current, option]
    );
  };

  const missingFields = () =>
    fields
      .filter((f) => f.required)
      .filter((f) => {
        const val = values[f.id];
        if (f.type === "multiselect") return !(Array.isArray(val) && val.length > 0);
        if (f.type === "checkbox") return val !== true;
        return !val || String(val).trim() === "";
      })
      .map((f) => f.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = missingFields();
    setErrors(missing);
    setConsentError(!dataConsent);
    if (missing.length > 0 || !dataConsent) {
      scrollToFirstError();
      return;
    }
    onSubmit({ ...values, marketingConsent });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">
          {eventLang === "en" ? "Join" : "Inscripción"} {eventName}
        </CardTitle>
        <CardDescription>
          {registrationSubtitle ||
            (eventLang === "en"
              ? "Fill in your details to participate"
              : "Completa tus datos para participar")}
          {eventDate && (
            <span className="block mt-2 text-primary font-medium">
              📅{" "}
              {eventDate.toLocaleDateString(
                eventLang === "en" ? "en-US" : "es-ES",
                { weekday: "long", day: "numeric", month: "long" }
              )}
              {eventTime && ` · 🕐 ${eventTime}`}
            </span>
          )}
          {eventLocation && (
            <span className="block mt-1 text-foreground/70 font-medium">
              📍 {eventLocation}
            </span>
          )}
        </CardDescription>
        {registrationDescription && (
          <div className="mt-4 text-sm text-foreground/80 text-left border-t pt-4">
            <RichTextRenderer
              content={registrationDescription}
              className="prose-p:mb-4 prose-p:leading-relaxed prose-headings:mb-2 prose-ul:mb-3 prose-ol:mb-3 prose-li:mb-1 [&_p]:mb-4 [&_p]:leading-relaxed [&_br]:block [&_br]:mb-2"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {(errors.length > 0 || consentError) && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive animate-fade-in">
              {eventLang === "en"
                ? "Please complete the highlighted fields below."
                : "Completa los campos destacados en rojo."}
            </div>
          )}
          {fields.map((field) => {
            const hasError = errors.includes(field.id);
            return (
            <div
              key={field.id}
              className={`space-y-2 ${hasError ? "rounded-lg border border-destructive/50 bg-destructive/5 p-3" : ""}`}
              data-field-error={hasError ? "true" : undefined}
            >
              <Label className={hasError ? "text-destructive" : undefined}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}

              {/* Text / Email / Phone / Number */}
              {(field.type === "text" ||
                field.type === "email" ||
                field.type === "phone" ||
                field.type === "number") && (
                <Input
                  type={field.type === "phone" ? "tel" : field.type}
                  value={(values[field.id] as string) || ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  placeholder={field.placeholder || field.label}
                  aria-invalid={hasError}
                  className={hasError ? errorInputClass : undefined}
                />
              )}

              {/* Textarea */}
              {field.type === "textarea" && (
                <Textarea
                  value={(values[field.id] as string) || ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  placeholder={field.placeholder || field.label}
                  rows={3}
                  aria-invalid={hasError}
                  className={hasError ? errorInputClass : undefined}
                />
              )}

              {/* Date */}
              {field.type === "date" && (
                <Input
                  type="date"
                  value={(values[field.id] as string) || ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  aria-invalid={hasError}
                  className={hasError ? errorInputClass : undefined}
                />
              )}

              {/* Select */}
              {field.type === "select" && (
                <Select
                  value={(values[field.id] as string) || ""}
                  onValueChange={(v) => setValue(field.id, v)}
                >
                  <SelectTrigger className={hasError ? errorInputClass : undefined}>
                    <SelectValue
                      placeholder={
                        field.placeholder ||
                        (eventLang === "en" ? "Select..." : "Seleccionar...")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Multiselect */}
              {field.type === "multiselect" && (
                <div className="space-y-2">
                  {(field.options || []).map((opt) => {
                    const selected = ((values[field.id] as string[]) || []).includes(opt);
                    return (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : hasError
                            ? "border-destructive/60 hover:border-destructive"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleMultiSelect(field.id, opt)}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Checkbox */}
              {field.type === "checkbox" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={!!values[field.id]}
                    onCheckedChange={(v) => setValue(field.id, !!v)}
                    className={hasError ? "border-destructive" : undefined}
                  />
                  <span className="text-sm">
                    {field.placeholder || field.label}
                  </span>
                </label>
              )}

              <FieldError show={hasError} message={fieldErrorMessage(eventLang)} />
            </div>
            );
          })}

          <GDPRConsent
            lang={eventLang}
            dataConsent={dataConsent}
            marketingConsent={marketingConsent}
            onDataConsentChange={(v) => { setDataConsent(v); if (v) setConsentError(false); }}
            onMarketingConsentChange={setMarketingConsent}
            error={consentError}
          />

          <Button
            type="submit"
            variant="hero"
            className="w-full mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {eventLang === "en" ? "Registering..." : "Registrando..."}
              </>
            ) : eventLang === "en" ? (
              "Register"
            ) : (
              "Inscribirme"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DynamicRegistrationForm;
