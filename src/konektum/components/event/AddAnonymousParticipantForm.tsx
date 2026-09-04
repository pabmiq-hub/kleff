// @ts-nocheck
import { useState } from "react";
import { Button } from "@/konektum/ui/button";
import { Input } from "@/konektum/ui/input";
import { Label } from "@/konektum/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/konektum/ui/select";
import { EyeOff } from "lucide-react";
import { AGE_RANGES, type Participant } from "@/konektum/lib/excelParser";
import type { EventCustomPreferences } from "./AddParticipantModal";

interface Props {
  onAdd: (participant: Participant) => void | Promise<void>;
  onCancel: () => void;
  customPreferences?: EventCustomPreferences;
}

const ANON_PREFERENCES = ["Solo amistad", "Amistad y ligue"];

/** Minimal registration for participants who only share basic data. */
const AddAnonymousParticipantForm = ({ onAdd, onCancel, customPreferences }: Props) => {
  const ageRanges = customPreferences?.ageRanges || [...AGE_RANGES];
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [preference, setPreference] = useState(ANON_PREFERENCES[0]);
  const [phone, setPhone] = useState("");

  const year = parseInt(birthYear, 10);
  const age = !isNaN(year) && year > 1900 && year <= currentYear ? currentYear - year : null;
  const isUnder18 = age !== null && age < 18;

  const ageRangeFor = (value: number): string => {
    for (const range of ageRanges) {
      if (range.includes("+")) {
        const num = parseInt(range.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && value >= num) return range;
        continue;
      }
      const parts = range.replace(/–/g, "-").split("-").map((n) => parseInt(n.trim(), 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && value >= parts[0] && value <= parts[1]) {
        return range;
      }
    }
    return "Otro";
  };

  const canSubmit = !!name.trim() && !!phone.trim() && age !== null && !isUnder18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || age === null) return;

    await onAdd({
      id: Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      age,
      ageRange: ageRangeFor(age),
      preferredAgeRange: "",
      preference,
      gender: "",
      phone: phone.trim(),
      birthDate: `${year}-01-01`,
      isAnonymous: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <EyeOff className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          Inscripción con datos mínimos. Este participante no verá el juego ni la afinidad
          en su panel, ya que no ha rellenado esa información.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="anon-name">Nombre *</Label>
        <Input
          id="anon-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: María G."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="anon-year">Año de nacimiento *</Label>
        <Input
          id="anon-year"
          type="number"
          inputMode="numeric"
          min={1900}
          max={currentYear}
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder="Ej: 1992"
          required
        />
        {age !== null && !isUnder18 && (
          <p className="text-xs text-muted-foreground">
            Edad aproximada: <strong>{age}</strong> · Rango: <strong>{ageRangeFor(age)}</strong>
          </p>
        )}
        {isUnder18 && (
          <p className="text-xs text-destructive font-medium">
            El participante debe ser mayor de 18 años
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Preferencia *</Label>
        <Select value={preference} onValueChange={setPreference}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANON_PREFERENCES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="anon-phone">Teléfono de contacto *</Label>
        <Input
          id="anon-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej: +34 612 345 678"
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="hero" className="flex-1" disabled={!canSubmit}>
          Añadir anónimo
        </Button>
      </div>
    </form>
  );
};

export default AddAnonymousParticipantForm;
