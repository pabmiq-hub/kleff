CREATE OR REPLACE FUNCTION public.kon_sync_event_participants_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event uuid;
BEGIN
  FOREACH v_event IN ARRAY ARRAY_REMOVE(ARRAY[
    CASE WHEN TG_OP <> 'INSERT' THEN OLD.event_id END,
    CASE WHEN TG_OP <> 'DELETE' THEN NEW.event_id END
  ], NULL)
  LOOP
    UPDATE public.kon_events e
       SET participants_count = (
         SELECT count(*) FROM public.kon_participants p
          WHERE p.event_id = e.id AND NOT p.is_fake AND p.cancelled_at IS NULL
       )
     WHERE e.id = v_event AND e.status = 'pending';
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS kon_participants_sync_count ON public.kon_participants;
CREATE TRIGGER kon_participants_sync_count
AFTER INSERT OR UPDATE OF event_id, is_fake, cancelled_at OR DELETE ON public.kon_participants
FOR EACH ROW EXECUTE FUNCTION public.kon_sync_event_participants_count();

UPDATE public.kon_events e
   SET participants_count = (
     SELECT count(*) FROM public.kon_participants p
      WHERE p.event_id = e.id AND NOT p.is_fake AND p.cancelled_at IS NULL)
 WHERE e.status = 'pending';