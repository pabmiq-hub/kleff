ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ludoya_user_id text,
  ADD COLUMN IF NOT EXISTS ludoya_display_name text,
  ADD COLUMN IF NOT EXISTS ludoya_avatar_url text,
  ADD COLUMN IF NOT EXISTS ludoya_linked_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_ludoya_user_id_key
  ON public.profiles (ludoya_user_id) WHERE ludoya_user_id IS NOT NULL;