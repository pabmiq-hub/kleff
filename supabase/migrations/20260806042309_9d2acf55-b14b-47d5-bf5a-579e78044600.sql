CREATE TABLE public.volunteer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','accepted','declined')),
  admin_notes text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX volunteer_applications_user_idx ON public.volunteer_applications(user_id);
CREATE INDEX volunteer_applications_status_idx ON public.volunteer_applications(status);

GRANT SELECT, INSERT ON public.volunteer_applications TO authenticated;
GRANT UPDATE, DELETE ON public.volunteer_applications TO authenticated;
GRANT ALL ON public.volunteer_applications TO service_role;

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own applications"
ON public.volunteer_applications FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Members create own applications"
ON public.volunteer_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update applications"
ON public.volunteer_applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins delete applications"
ON public.volunteer_applications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_volunteer_applications_updated_at
BEFORE UPDATE ON public.volunteer_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();