CREATE TABLE public.karma_user_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cycle_index integer NOT NULL DEFAULT 1,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  carryover_in integer NOT NULL DEFAULT 0,
  points_at_close integer,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cycle_index)
);

GRANT SELECT ON public.karma_user_cycles TO authenticated;
GRANT ALL ON public.karma_user_cycles TO service_role;

ALTER TABLE public.karma_user_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own karma cycles"
ON public.karma_user_cycles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER karma_user_cycles_updated_at
BEFORE UPDATE ON public.karma_user_cycles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.karma_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  carryover_max integer NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.karma_settings TO authenticated;
GRANT ALL ON public.karma_settings TO service_role;

ALTER TABLE public.karma_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read karma settings"
ON public.karma_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage karma settings"
ON public.karma_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER karma_settings_updated_at
BEFORE UPDATE ON public.karma_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.karma_settings (id, carryover_max) VALUES (true, 30) ON CONFLICT (id) DO NOTHING;