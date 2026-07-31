import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { getMyProfile } from "@/lib/profile.functions";
import { KarmaLevelBadge } from "@/components/app/KarmaLevelBadge";

export const Route = createFileRoute("/app/carnet")({
  component: CarnetPage,
});

interface ProfileData {
  id: string;
  member_number: number;
  full_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

function CarnetPage() {
  const fn = useServerFn(getMyProfile);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fn({ data: undefined as never })
      .then((r) => setProfile(r.profile as ProfileData | null))
      .finally(() => setLoading(false));
  }, [fn]);

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;
  if (!profile) return <p className="text-muted-foreground">No se pudo cargar tu carnet.</p>;

  const memberNumber = `K-${String(profile.member_number).padStart(4, "0")}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Mi carnet</h1>
        <p className="text-muted-foreground mt-1">Tu identificación como Kleffer.</p>
      </header>

      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-coral via-coral-deep to-ink text-cream rounded-3xl p-6 shadow-tactile border-2 border-ink relative overflow-hidden">
          <div className="absolute top-2 right-3 font-display font-bold text-xl tracking-tight opacity-90">KLEFF</div>
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-cream/10" />

          <div className="relative space-y-6 mt-8">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover border-4 border-cream" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-cream/20 border-4 border-cream flex items-center justify-center font-display text-3xl font-bold">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-display text-2xl font-bold leading-tight">{profile.full_name}</p>
                <p className="text-cream/70 text-sm">@{profile.username}</p>
              </div>
            </div>

            <div className="border-t border-cream/20 pt-4 flex items-end justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-cream/60">Nº socio</p>
                  <p className="font-mono text-3xl font-bold">{memberNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-cream/60">Socio desde</p>
                  <p className="font-semibold">{new Date(profile.created_at).toLocaleDateString("es-ES")}</p>
                </div>
              </div>
              <div className="bg-cream p-2 rounded-lg border-2 border-ink shrink-0">
                <QRCodeSVG
                  value={`https://www.kleff.es/verificar/${profile.id}`}
                  size={110}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                />
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Escanea el QR para verificar el carnet como socio.
        </p>
      </div>
    </div>
  );
}
