// @ts-nocheck
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/konektum/ui/dialog";
import { Button } from "@/konektum/ui/button";
import { Input } from "@/konektum/ui/input";
import { Label } from "@/konektum/ui/label";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { CustomTableLayout, CustomTableFill, getCustomTableFill } from "@/konektum/lib/customTableLayout";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCapacity: number;
  initialLayout: CustomTableLayout | null | undefined;
  onSave: (layout: CustomTableLayout) => void | Promise<void>;
}

const CustomTableLayoutDialog = ({ open, onOpenChange, defaultCapacity, initialLayout, onSave }: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [numTables, setNumTables] = useState<number>(initialLayout?.tables.length || 5);
  const [capacities, setCapacities] = useState<number[]>(
    initialLayout?.tables.map(t => t.capacity) || []
  );
  const [fill, setFill] = useState<CustomTableFill>(getCustomTableFill(initialLayout));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const initial = initialLayout?.tables.map(t => t.capacity);
      setStep(1);
      setNumTables(initial?.length || 5);
      setCapacities(initial || []);
      setFill(getCustomTableFill(initialLayout));
    }
  }, [open, initialLayout]);

  const goToStep2 = () => {
    const n = Math.max(1, Math.min(50, Math.floor(numTables) || 1));
    // Preserve previous capacities where possible
    const next = Array.from({ length: n }, (_, i) => capacities[i] ?? defaultCapacity ?? 4);
    setCapacities(next);
    setNumTables(n);
    setStep(2);
  };

  const updateCapacity = (idx: number, value: number) => {
    setCapacities(prev => prev.map((c, i) => (i === idx ? value : c)));
  };

  const totalSeats = capacities.reduce((a, b) => a + (Number(b) || 0), 0);

  const handleSave = async () => {
    const cleaned = capacities.map(c => Math.max(2, Math.min(20, Math.floor(Number(c) || 0))));
    setSaving(true);
    try {
      await onSave({ enabled: true, tables: cleaned.map(capacity => ({ capacity })), fill });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar mesas</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "¿Cuántas mesas tendrá el evento?"
              : "Define la capacidad de cada mesa. Los participantes se reparten proporcionalmente."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-2">
            <Label htmlFor="num-tables">Número de mesas</Label>
            <Input
              id="num-tables"
              type="number"
              min={1}
              max={50}
              value={numTables}
              onChange={(e) => setNumTables(parseInt(e.target.value) || 1)}
            />
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {capacities.map((cap, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Label className="w-20 text-sm">Mesa {idx + 1}</Label>
                <Input
                  type="number"
                  min={2}
                  max={20}
                  value={cap}
                  onChange={(e) => updateCapacity(idx, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
            <div className="pt-2 space-y-2 border-t">
              <Label className="text-sm">Reparto de participantes</Label>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setFill("balanced")}
                  className={`text-left rounded-md border px-3 py-2 text-sm ${fill === "balanced" ? "border-primary bg-primary/5" : ""}`}
                >
                  <strong>Equilibrado</strong>
                  <span className="block text-xs text-muted-foreground">
                    Se crean siempre todas las mesas configuradas y se reparten los asistentes entre ellas sin superar su capacidad.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFill("sequential")}
                  className={`text-left rounded-md border px-3 py-2 text-sm ${fill === "sequential" ? "border-primary bg-primary/5" : ""}`}
                >
                  <strong>Secuencial</strong>
                  <span className="block text-xs text-muted-foreground">
                    Se llena la mesa 1 hasta su capacidad, luego la 2, y así sucesivamente.
                  </span>
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Capacidad total: <strong>{totalSeats}</strong> plazas en {capacities.length} mesas
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step === 2 && (
            <Button variant="ghost" onClick={() => setStep(1)} className="mr-auto">
              <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {step === 1 ? (
            <Button onClick={goToStep2}>
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomTableLayoutDialog;
