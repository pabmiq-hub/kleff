
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id) WHERE read_at IS NULL;

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Daily reminder: rentals due within next 24h and not yet reminded
CREATE TABLE public.rental_reminders_sent (
  rental_id UUID PRIMARY KEY REFERENCES public.rentals(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.rental_reminders_sent TO service_role;
ALTER TABLE public.rental_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.send_rental_due_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT rn.id, rn.user_id, rn.due_at, g.title
      FROM public.rentals rn
      LEFT JOIN public.bgg_games g ON g.id = rn.game_id
     WHERE rn.status = 'active'
       AND rn.due_at > now()
       AND rn.due_at <= now() + interval '24 hours'
       AND NOT EXISTS (SELECT 1 FROM public.rental_reminders_sent s WHERE s.rental_id = rn.id)
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, url)
    VALUES (
      r.user_id,
      'rental_due_soon',
      'Recordatorio de devolución',
      'Debes devolver "' || COALESCE(r.title, 'tu juego') || '" antes del ' || to_char(r.due_at, 'DD/MM/YYYY HH24:MI'),
      '/app/rentals/mine'
    );
    INSERT INTO public.rental_reminders_sent (rental_id) VALUES (r.id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'rental-due-reminders',
  '0 * * * *',
  $$ SELECT public.send_rental_due_reminders(); $$
);
