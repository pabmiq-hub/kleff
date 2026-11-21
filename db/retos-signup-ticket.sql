-- Número de sorteo opcional por crear perfil en el reto.
ALTER TABLE public.reto_events ADD COLUMN IF NOT EXISTS signup_ticket boolean NOT NULL DEFAULT false;
