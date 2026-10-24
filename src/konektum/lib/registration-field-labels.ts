// Translate only known built-in copy. Option values remain the original strings
// used by quotas, matching and saved participant records.
const englishLabels: Record<string, Record<string, string>> = {
  name: { "Nombre y apellidos": "Full name", "Nombre completo": "Full name" },
  email: { Email: "Email" },
  phone: { "Teléfono": "Phone" },
  birth_date: { "Fecha de nacimiento": "Date of birth" },
  gender: { "Género": "Gender" },
  preference: { "Tipo de conexión": "Connection type", Preferencia: "Connection type" },
  dating_preference: { "Preferencia de ligue": "Dating preference", "Preferencia romántica": "Dating preference" },
};

const englishOptions: Record<string, Record<string, string>> = {
  gender: {
    Hombre: "Man", Mujer: "Woman", "No binario": "Non-binary",
    "Prefiero no decirlo": "Prefer not to say",
  },
  preference: {
    "Amistad y ligue": "Friendship & dating", "Solo amistad": "Friendship only",
    "Sólo amistad": "Friendship only",
  },
  dating_preference: {
    "Soy un hombre y busco una mujer": "I'm a man looking for a woman",
    "Soy un hombre y busco un hombre": "I'm a man looking for a man",
    "Soy una mujer y busco un hombre": "I'm a woman looking for a man",
    "Soy una mujer y busco una mujer": "I'm a woman looking for a woman",
    "No binario": "Non-binary", "Estoy abierto a todo": "Open to all",
    "Prefiero no contestar": "Prefer not to say",
  },
};

type FieldIdentity = { id: string; system?: boolean };

export function registrationFieldLabel(field: FieldIdentity, text: string, lang: "es" | "en") {
  if (lang !== "en" || !field.system) return text;
  return englishLabels[field.id]?.[text] ?? text;
}

export function registrationOptionLabel(field: FieldIdentity, value: string, lang: "es" | "en") {
  if (lang !== "en" || !field.system) return value;
  return englishOptions[field.id]?.[value] ?? value;
}

export function registrationPlaceholder(field: FieldIdentity, text: string | undefined, lang: "es" | "en") {
  if (!text || lang !== "en" || !field.system) return text;
  if (text === "Seleccionar..." || text === "Selecciona…" || text === "Seleccionar…") return "Select...";
  return registrationFieldLabel(field, text, lang);
}