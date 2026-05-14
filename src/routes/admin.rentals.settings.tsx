import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRentalSettings, updateRentalSettings } from "@/server/rental.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/rentals/settings")({
  component: SettingsPage,
});

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function SettingsPage() {
  const getFn = useServerFn(getRentalSettings);
  const updFn = useServerFn(updateRentalSettings);
  const [weekday, setWeekday] = useState(3);
  const [cooldown, setCooldown] = useState(4);
  const [quota, setQuota] = useState(2);
  const [block, setBlock] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getFn().then((r) => {
      setWeekday(r.settings.game_night_weekday);
      setCooldown(r.settings.cooldown_weeks);
      setQuota(r.settings.monthly_quota);
      setBlock(r.settings.block_if_overdue);
    });
  }, [getFn]);

  const save = async () => {
    setSaving(true);
    try {
      await updFn({
        data: {
          gameNightWeekday: weekday,
          cooldownWeeks: cooldown,
          monthlyQuota: quota,
          blockIfOverdue: block,
        },
      });
      toast.success("Ajustes guardados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="space-y-1">
        <Label className="text-cream/80">Día de la noche de juego</Label>
        <Select value={String(weekday)} onValueChange={(v) => setWeekday(Number(v))}>
          <SelectTrigger className="bg-cream/10 border-cream/20 text-cream"><SelectValue /></SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-cream/60">Las recogidas y devoluciones se calcularán a partir de este día.</p>
      </div>

      <div className="space-y-1">
        <Label className="text-cream/80">Cooldown del mismo juego (semanas)</Label>
        <Input type="number" min={0} max={52} value={cooldown} onChange={(e) => setCooldown(Number(e.target.value) || 0)} className="bg-cream/10 border-cream/20 text-cream" />
        <p className="text-xs text-cream/60">El socio no podrá volver a alquilar el mismo juego en este periodo.</p>
      </div>

      <div className="space-y-1">
        <Label className="text-cream/80">Cuota mensual de alquileres por socio</Label>
        <Input type="number" min={0} max={20} value={quota} onChange={(e) => setQuota(Number(e.target.value) || 0)} className="bg-cream/10 border-cream/20 text-cream" />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={block} onCheckedChange={setBlock} />
        <Label className="text-cream/80">Bloquear nuevos alquileres si el socio tiene una devolución atrasada</Label>
      </div>

      <Button onClick={save} disabled={saving} className="bg-coral hover:bg-coral-deep text-cream">
        {saving ? "Guardando…" : "Guardar ajustes"}
      </Button>
    </div>
  );
}
