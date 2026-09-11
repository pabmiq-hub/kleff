CREATE OR REPLACE FUNCTION public.kon_participants_prevent_duplicate_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE v_email text;
BEGIN
  v_email := lower(btrim(coalesce(NEW.email, '')));
  IF v_email = '' OR NEW.cancelled_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(NEW.event_id::text || '|' || v_email));
  IF EXISTS (
    SELECT 1 FROM public.kon_participants p
     WHERE p.event_id = NEW.event_id
       AND lower(btrim(p.email)) = v_email
       AND p.cancelled_at IS NULL
       AND (TG_OP = 'INSERT' OR p.id <> NEW.id)
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_PARTICIPANT_EMAIL' USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kon_participants_no_duplicate_email ON public.kon_participants;
CREATE TRIGGER kon_participants_no_duplicate_email
BEFORE INSERT OR UPDATE OF email, cancelled_at ON public.kon_participants
FOR EACH ROW EXECUTE FUNCTION public.kon_participants_prevent_duplicate_email();