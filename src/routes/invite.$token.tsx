import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { validateInvitation, acceptInvitation } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppLocale } from "@/i18n/app-i18n";
import { signupDict } from "@/i18n/app/signup";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { optimizeImage } from "@/lib/image-optimize";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ params }) => {
    const result = await validateInvitation({ data: { token: params.token } });
    return { invitation: result, token: params.token };
  },
  component: InvitePage,
});

function InvitePage() {
  const { invitation, token } = Route.useLoaderData();
  const navigate = useNavigate();
  const acceptFn = useServerFn(acceptInvitation);
  const { locale, setLocale } = useAppLocale();
  const t = signupDict[locale];

  const [step, setStep] = useState<"language" | "form">("language");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    password: "",
    username: "",
    fullName: "",
    dateOfBirth: "",
    gender: "" as "" | "female" | "male" | "non_binary" | "other" | "prefer_not_to_say",
    idDocument: "",
  });

  if (!invitation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-deep px-4">
        <div className="bg-card border-2 border-ink rounded-2xl shadow-tactile p-8 max-w-md text-center">
          <h1 className="font-display text-2xl font-bold mb-2">{t.invalidTitle}</h1>
          <p className="text-muted-foreground mb-6">{t.reasons[invitation.reason]}</p>
          <Link to="/" className="text-coral-deep underline">{t.backToSite}</Link>
        </div>
      </div>
    );
  }

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.imageTooBig);
      return;
    }
    setUploadingAvatar(true);
    // Use a temp folder + a random uuid; we'll move it on accept... or just leave it.
    // Simpler: use the email + random name (anonymous upload not allowed in policy).
    // Workaround: upload via a server function with service role
    try {
      const { file: optimized } = await optimizeImage(file, { maxSize: 512, quality: 0.85 });
      const formData = new FormData();
      formData.append("file", optimized);
      const res = await fetch(`/api/public/upload-invite-avatar?token=${encodeURIComponent(token)}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = (await res.json()) as { url: string };
      setAvatarUrl(json.url);
      toast.success(t.photoUploaded);
    } catch {
      toast.error(t.photoError);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.gender) {
      toast.error(t.selectGenderError);
      return;
    }
    setSubmitting(true);
    try {
      await acceptFn({
        data: {
          token,
          password: form.password,
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          avatarUrl,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          idDocument: form.idDocument.trim().toUpperCase(),
          locale,
        },
      });
      // Auto-login
      const { error } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: form.password,
      });
      if (error) throw error;
      toast.success(t.welcome);
      void navigate({ to: "/app" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.createError;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "language") {
    return (
      <div className="min-h-screen bg-cream-deep py-8 px-4 flex items-center">
        <div className="max-w-xl mx-auto w-full">
          <Link to="/" className="block text-center mb-6">
            <span className="font-display font-bold text-2xl">KLEFF</span>
          </Link>
          <div className="bg-card border-2 border-ink rounded-2xl shadow-tactile p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wider text-coral-deep font-bold mb-2">{t.step1}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t.languageTitle}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t.languageSubtitle}</p>
            <div className="grid gap-3">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  aria-pressed={locale === l}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 font-semibold transition-colors ${
                    locale === l
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/20 bg-cream-deep/40 text-foreground hover:border-ink"
                  }`}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
            <Button className="w-full mt-6" onClick={() => setStep("form")}>
              {t.continue}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-deep py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="block text-center mb-6">
          <span className="font-display font-bold text-2xl">KLEFF</span>
        </Link>

        <div className="bg-card border-2 border-ink rounded-2xl shadow-tactile p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs uppercase tracking-wider text-coral-deep font-bold">{t.step2}</p>
            <button
              type="button"
              onClick={() => setStep("language")}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              {t.changeLanguage}
            </button>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">{t.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t.introA} <strong>{invitation.email}</strong>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t.username} *</Label>
                <Input
                  id="username"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_.\-]+"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder={t.usernamePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.fullName} *</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t.dateOfBirth} *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">{t.gender} *</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as typeof form.gender })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder={t.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">{t.genders.female}</SelectItem>
                    <SelectItem value="male">{t.genders.male}</SelectItem>
                    <SelectItem value="non_binary">{t.genders.non_binary}</SelectItem>
                    <SelectItem value="other">{t.genders.other}</SelectItem>
                    <SelectItem value="prefer_not_to_say">{t.genders.prefer_not_to_say}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idDocument">{t.idDocument} *</Label>
              <Input
                id="idDocument"
                required
                value={form.idDocument}
                onChange={(e) => setForm({ ...form, idDocument: e.target.value })}
                placeholder="12345678A"
              />
              <p className="text-xs text-muted-foreground">{t.idDocumentHelp}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">{t.avatar}</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                disabled={uploadingAvatar}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAvatarUpload(f);
                }}
              />
              {avatarUrl && (
                <img width={80} height={80} loading="lazy" decoding="async" src={avatarUrl} alt="" className="mt-2 h-20 w-20 rounded-full object-cover border-2 border-ink" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.password} *</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t.passwordHelp}</p>
            </div>

            <Button type="submit" disabled={submitting || uploadingAvatar} className="w-full">
              {submitting ? t.submitting : t.submit}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
