import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getLudoyaLinkStatus,
  startLudoyaLink,
  unlinkLudoyaAccount,
} from "@/lib/ludoya-oidc.functions";
import { linkLudoyaAccount, inviteMeToKleff } from "@/lib/ludoya.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useAppLocale } from "@/i18n/app-i18n";
import { accountDict } from "@/i18n/app/account";

type LudoyaProfile = {
  ludoya_username: string | null;
  ludoya_user_id: string | null;
  ludoya_display_name: string | null;
  ludoya_avatar_url: string | null;
  ludoya_linked_at: string | null;
};

function waitForPopup(popup: Window) {
  return new Promise<void>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const type = (event.data as { type?: string })?.type;
      if (type !== "ludoyaLinkComplete" && type !== "ludoyaLinkFailed") return;
      cleanup();
      if (type === "ludoyaLinkComplete") resolve();
      else reject(new Error((event.data as { error?: string })?.error ?? "link-failed"));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("window-closed"));
    }, 600);
  });
}

export function LudoyaLinkCard({ onChanged }: { onChanged?: () => void }) {
  const statusFn = useServerFn(getLudoyaLinkStatus);
  const startFn = useServerFn(startLudoyaLink);
  const unlinkFn = useServerFn(unlinkLudoyaAccount);
  const manualLinkFn = useServerFn(linkLudoyaAccount);
  const inviteFn = useServerFn(inviteMeToKleff);

  const [configured, setConfigured] = useState(false);
  const [profile, setProfile] = useState<LudoyaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const { locale } = useAppLocale();
  const t = accountDict[locale].ludoya;

  const reload = useCallback(
    () =>
      statusFn({ data: undefined as never }).then((r) => {
        setConfigured(r.configured);
        setProfile((r.profile as LudoyaProfile | null) ?? null);
        setManual(((r.profile as LudoyaProfile | null)?.ludoya_username) ?? "");
      }),
    [statusFn],
  );

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, [reload]);

  const linked = Boolean(profile?.ludoya_username || profile?.ludoya_user_id);

  const handleConnect = async () => {
    const popup = window.open("", "ludoya-oauth", "width=520,height=720");
    if (!popup) {
      toast.error(t.popupBlocked);
      return;
    }
    setBusy(true);
    try {
      const { authorizationUrl } = await startFn({ data: undefined as never });
      const done = waitForPopup(popup);
      popup.location.href = authorizationUrl;
      await done;
      await reload();
      onChanged?.();
      toast.success(t.linkedSuccess);
    } catch (err) {
      popup.close();
      toast.error(err instanceof Error && err.message !== "link-failed" && err.message !== "window-closed" ? err.message : t.linkFail);
    } finally {
      setBusy(false);
    }
  };

  const handleManual = async () => {
    const name = manual.trim();
    if (name.length < 2) return;
    setBusy(true);
    try {
      const r = await manualLinkFn({ data: { username: name } });
      if (r.linked) {
        await reload();
        onChanged?.();
        toast.success(t.linkedManualSuccess);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    setBusy(true);
    try {
      await unlinkFn({ data: undefined as never });
      await reload();
      onChanged?.();
      toast.success(t.unlinkedSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async () => {
    setBusy(true);
    try {
      const r = await inviteFn({ data: undefined as never });
      if (r.status === "invited") toast.success(t.invitedSuccess);
      else if (r.status === "already") toast.info(t.alreadyMember);
      else if (r.status === "not_found") toast.error(t.userNotFound);
      else toast.error(t.inviteFailed(r.httpStatus));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
      <header>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          {t.title}
          {linked && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.connectPrefix}{" "}
          <a
            href="https://app.ludoya.com/kleff"
            target="_blank"
            rel="noreferrer"
            className="underline inline-flex items-center gap-1"
          >
            Ludoya <ExternalLink className="h-3 w-3" />
          </a>{" "}
          {t.description}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      ) : linked ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {profile?.ludoya_avatar_url && (
              <img
                src={profile.ludoya_avatar_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover border border-ink/20"
              />
            )}
            <div className="text-sm">
              <p className="font-semibold">{profile?.ludoya_display_name ?? t.linkedAccount}</p>
              {profile?.ludoya_username && (
                <a
                  href={`https://app.ludoya.com/${profile.ludoya_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs underline text-muted-foreground"
                >
                  @{profile.ludoya_username}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {configured && (
              <Button type="button" variant="outline" size="sm" onClick={handleConnect} disabled={busy}>
                {t.resync}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={handleInvite} disabled={busy}>
              {t.resendInvite}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleUnlink} disabled={busy}>
              {t.unlink}
            </Button>
          </div>
        </div>
      ) : configured ? (
        <Button type="button" onClick={handleConnect} disabled={busy}>
          <Link2 className="h-4 w-4 mr-2" />
          {busy ? t.connecting : t.link}
        </Button>
      ) : (
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="ludoya">{t.manualLabel}</Label>
            <Input
              id="ludoya"
              placeholder={t.manualPlaceholder}
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              pattern="[a-zA-Z0-9_.\-]+"
            />
          </div>
          <Button type="button" onClick={handleManual} disabled={busy || manual.trim().length < 2}>
            {busy ? t.linking : t.manualLink}
          </Button>
        </div>
      )}
    </section>
  );
}
