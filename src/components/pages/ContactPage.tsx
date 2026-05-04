import { useState } from "react";
import { Mail, MapPin, Phone, Instagram, Send, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EditableText } from "@/editor/Editable";
import { useSectionContent } from "@/cms/useSectionContent";
import { or } from "@/cms/or";

export function ContactPage() {
  const { t } = useI18n();
  const hero = useSectionContent("contact.hero");
  const info = useSectionContent<{
    email: string;
    phone: string;
    instagram: string;
    instagramUrl: string;
    address: string;
  }>("contact.info");
  const [submitted, setSubmitted] = useState(false);

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12 text-center">
          <EditableText id="contact.hero.eyebrow" as="span" className="inline-flex items-center gap-2 rounded-full bg-primary-soft/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-coral-deep">
            {t.contact.eyebrow}
          </EditableText>
          <EditableText id="contact.hero.title" as="h1" className="mt-5 text-5xl sm:text-6xl font-display font-semibold text-foreground">
            {t.contact.title}
          </EditableText>
          <EditableText id="contact.hero.subtitle" as="p" className="mt-5 text-lg text-foreground/75 max-w-2xl mx-auto leading-relaxed">
            {t.contact.subtitle}
          </EditableText>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl bg-card border border-border/60 p-6 sm:p-10 shadow-soft">
              {submitted ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-coral-deep mx-auto" />
                  <p className="mt-4 text-xl font-display font-semibold text-foreground">
                    {t.contact.success}
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="space-y-5"
                >
                  <Field label={t.contact.nameLabel} name="name" type="text" required />
                  <Field label={t.contact.emailLabel} name="email" type="email" required />
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      {t.contact.messageLabel}
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30 transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-coral text-primary-foreground px-6 py-3.5 text-sm font-semibold shadow-glow hover:shadow-warm hover:-translate-y-0.5 transition-all"
                  >
                    {t.contact.submit}
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-4">
            <InfoCard
              icon={<Mail className="h-5 w-5" />}
              title="Email"
              value="hola@kleff.es"
              href="mailto:hola@kleff.es"
            />
            <InfoCard
              icon={<Phone className="h-5 w-5" />}
              title="Teléfono"
              value="605 355 109"
              href="tel:+34605355109"
            />
            <InfoCard
              icon={<Instagram className="h-5 w-5" />}
              title="Instagram"
              value="@kleff.bcn"
              href="https://www.instagram.com/kleff.bcn/"
            />
            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              title={t.contact.findUs}
              value="L'Estació Espai Gastronòmic · Av. Marquès de l'Argentera 6-8, Barcelona"
            />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  name,
  type,
  required,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-2">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30 transition-all"
      />
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="h-10 w-10 rounded-xl bg-coral/15 text-coral-deep flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        <div className="mt-1 text-base font-medium text-foreground">{value}</div>
      </div>
    </>
  );
  const className =
    "flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/60 hover:border-coral/40 hover:shadow-soft transition-all";
  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}
