-- A.1 Inscripciones monolingües: eliminar ca/en, renombrar _es a base, añadir kind
-- Renombrar columnas _es a base
ALTER TABLE public.registration_forms RENAME COLUMN title_es TO title;
ALTER TABLE public.registration_forms RENAME COLUMN description_es TO description;
ALTER TABLE public.registration_forms RENAME COLUMN confirmation_message_es TO confirmation_message;

-- Eliminar columnas ca/en (datos no recuperables)
ALTER TABLE public.registration_forms DROP COLUMN IF EXISTS title_ca;
ALTER TABLE public.registration_forms DROP COLUMN IF EXISTS title_en;
ALTER TABLE public.registration_forms DROP COLUMN IF EXISTS description_ca;
ALTER TABLE public.registration_forms DROP COLUMN IF EXISTS description_en;
ALTER TABLE public.registration_forms DROP COLUMN IF EXISTS confirmation_message_ca;
ALTER TABLE public.registration_forms DROP COLUMN IF EXISTS confirmation_message_en;

-- Añadir kind: 'form' (formulario nativo) o 'external' (enlace externo)
ALTER TABLE public.registration_forms
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'form'
  CHECK (kind IN ('form','external'));

-- Migrar registros existentes con external_mode → kind='external'
UPDATE public.registration_forms
   SET kind = 'external'
 WHERE external_mode IS NOT NULL;

-- Preguntas monolingües
ALTER TABLE public.registration_questions RENAME COLUMN label_es TO label;
ALTER TABLE public.registration_questions RENAME COLUMN help_es TO help;
ALTER TABLE public.registration_questions DROP COLUMN IF EXISTS label_ca;
ALTER TABLE public.registration_questions DROP COLUMN IF EXISTS label_en;
ALTER TABLE public.registration_questions DROP COLUMN IF EXISTS help_ca;
ALTER TABLE public.registration_questions DROP COLUMN IF EXISTS help_en;