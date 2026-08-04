CREATE TABLE public.member_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  attends_alone text,
  scheduled_games text,
  goals text[] NOT NULL DEFAULT '{}',
  favorite_games jsonb NOT NULL DEFAULT '[]'::jsonb,
  game_types text[] NOT NULL DEFAULT '{}',
  experience_level text,
  availability text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  teaches text,
  bio text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_profiles TO authenticated;
GRANT ALL ON public.member_profiles TO service_role;

ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their own extended profile"
ON public.member_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can view public extended profiles"
ON public.member_profiles FOR SELECT TO authenticated
USING (is_public = true);

CREATE POLICY "Super admins manage all extended profiles"
ON public.member_profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER member_profiles_set_updated_at
BEFORE UPDATE ON public.member_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();