ALTER TABLE public.kon_events ADD COLUMN IF NOT EXISTS waitlist_promotion_mode text NOT NULL DEFAULT 'auto';
ALTER TABLE public.kon_events DROP CONSTRAINT IF EXISTS kon_events_waitlist_promotion_mode_check;
ALTER TABLE public.kon_events ADD CONSTRAINT kon_events_waitlist_promotion_mode_check CHECK (waitlist_promotion_mode IN ('auto','manual'));