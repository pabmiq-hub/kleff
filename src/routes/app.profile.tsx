import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { optimizeImage } from "@/lib/image-optimize";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { LudoyaLinkCard } from "@/components/app/LudoyaLinkCard";
import { KlefferProfileForm } from "@/components/app/KlefferProfileForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, ShieldCheck } from "lucide-react";

import { KarmaLevelBadge } from "@/components/app/KarmaLevelBadge";
import { useAppLocale } from "@/i18n/app-i18n";
import { accountDict } from "@/i18n/app/account";
import { commonDict } from "@/i18n/app/common";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const fetchProfile = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const { locale } = useAppLocale();
  const t = accountDict[locale];
  const c = commonDict[locale];


  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [memberNumber, setMemberNumber] = useState<number | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    gender: "" as "" | "female" | "male" | "non_binary" | "other" | "prefer_not_to_say",
    avatarUrl: "",
    dateOfBirth: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);




  const reload = () =>
    fetchProfile({ data: undefined as never }).then((r) => {
      if (r.profile) {
        setForm({
          fullName: r.profile.full_name,
          username: r.profile.username,
          gender: r.profile.gender,
          avatarUrl: r.profile.avatar_url ?? "",
          dateOfBirth: r.profile.date_of_birth ?? "",
        });
        setMemberNumber(r.profile.member_number ?? null);

      }
    });

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gender) {
      toast.error(t.profile.selectGenderError);
      return;
    }
    if (!form.dateOfBirth) {
      toast.error(t.profile.dobRequiredError);
      return;
    }
    setSubmitting(true);
    try {
      await updateFn({
        data: {
          fullName: form.fullName,
          username: form.username,
          gender: form.gender,
          avatarUrl: form.avatarUrl || null,
          dateOfBirth: form.dateOfBirth,
        },
      });
      toast.success(t.profile.updateSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profile.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.profile.imageTooLargeError);
      return;
    }
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error(t.profile.invalidSessionError);
      const { file: optimized } = await optimizeImage(file, { maxSize: 512, quality: 0.85 });
      const fd = new FormData();
      fd.append("file", optimized);
      const res = await fetch("/api/public/upload-my-avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { url: string };
      setForm((f) => ({ ...f, avatarUrl: json.url }));
      toast.success(t.profile.photoUpdated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profile.photoUploadError);
    } finally {
      setUploading(false);
    }
  };




  if (loading) return <p className="text-muted-foreground">{t.layout.loading}</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{t.profile.title}</h1>
          <KarmaLevelBadge />
        </div>
        {memberNumber !== null && (
          <p className="text-sm text-muted-foreground">
            {t.profile.memberNumber} <span className="font-mono font-semibold text-ink">{memberNumber}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full border-2 border-ink overflow-hidden bg-cream-deep shrink-0">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-ink/30 text-xs">{t.profile.noPhoto}</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleAvatarUpload(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? t.profile.uploading : form.avatarUrl ? t.profile.changePhoto : t.profile.uploadPhoto}
            </Button>
            {form.avatarUrl && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-coral-deep text-left"
                onClick={() => setForm((f) => ({ ...f, avatarUrl: "" }))}
              >
                {t.profile.removePhoto}
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t.profile.fullName}</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t.profile.username}</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_.\-]+"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t.profile.dateOfBirth}</Label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t.profile.gender}</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as typeof form.gender })}>
              <SelectTrigger><SelectValue placeholder={t.profile.genderPlaceholder} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">{t.profile.genderFemale}</SelectItem>
                <SelectItem value="male">{t.profile.genderMale}</SelectItem>
                <SelectItem value="non_binary">{t.profile.genderNonBinary}</SelectItem>
                <SelectItem value="other">{t.profile.genderOther}</SelectItem>
                <SelectItem value="prefer_not_to_say">{t.profile.genderPreferNot}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-ink/15 bg-cream-deep/40 p-3 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-700 shrink-0" />
          <p>
            {t.profile.idNotice}{" "}
            <a href="mailto:hola@kleff.es" className="underline">hola@kleff.es</a>.
          </p>
        </div>

        <Button type="submit" disabled={submitting}>{submitting ? c.saving : c.saveChanges}</Button>
      </form>

      <LudoyaLinkCard onChanged={() => void reload()} />

      <KlefferProfileForm />



    </div>
  );
}
