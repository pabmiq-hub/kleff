
CREATE TABLE public.featured_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.bgg_games(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notified_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX featured_games_dates_idx ON public.featured_games(start_date, end_date);
CREATE INDEX featured_games_game_idx ON public.featured_games(game_id);

GRANT SELECT ON public.featured_games TO authenticated;
GRANT ALL ON public.featured_games TO service_role;

ALTER TABLE public.featured_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view featured"
ON public.featured_games FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage featured"
ON public.featured_games FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE OR REPLACE FUNCTION public.featured_games_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER featured_games_updated_at
BEFORE UPDATE ON public.featured_games
FOR EACH ROW EXECUTE FUNCTION public.featured_games_touch_updated_at();
