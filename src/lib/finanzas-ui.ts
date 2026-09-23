export const eur = (n: number) =>
  (Number(n) || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const currentYear = () => new Date().getFullYear();

export const yearOptions = () => {
  const y = currentYear();
  return [y + 1, y, y - 1, y - 2, y - 3];
};

export const fechaCorta = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
