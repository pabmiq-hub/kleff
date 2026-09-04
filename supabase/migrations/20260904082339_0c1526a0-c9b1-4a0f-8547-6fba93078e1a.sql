ALTER TABLE public.kon_global_participants DROP CONSTRAINT IF EXISTS kon_unique_organizer_email;
ALTER TABLE public.kon_global_participants DROP CONSTRAINT IF EXISTS kon_unique_organizer_phone;
ALTER TABLE public.kon_global_participants ADD CONSTRAINT kon_unique_organizer_email UNIQUE (organizer_id, email);
ALTER TABLE public.kon_global_participants ADD CONSTRAINT kon_unique_organizer_phone UNIQUE (organizer_id, phone);