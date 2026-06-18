
ALTER TYPE shelf_location ADD VALUE IF NOT EXISTS 'A';
ALTER TYPE shelf_location ADD VALUE IF NOT EXISTS 'B';
ALTER TYPE shelf_location ADD VALUE IF NOT EXISTS 'C';
ALTER TYPE shelf_location ADD VALUE IF NOT EXISTS 'D';

DO $$ BEGIN
  CREATE TYPE shelf_color AS ENUM ('green','pink','red','yellow','blue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.bgg_games ADD COLUMN IF NOT EXISTS shelf_color shelf_color;

CREATE OR REPLACE FUNCTION public.validate_bgg_game_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.shelf IN ('A','B','C','D','1','2','3','4') THEN
    IF NEW.drawer_number IS NOT NULL OR NEW.drawer_letter IS NOT NULL THEN
      RAISE EXCEPTION 'drawer_* must be null for shelf A-D';
    END IF;
    IF NEW.slot_number IS NOT NULL AND (NEW.slot_number < 1 OR NEW.slot_number > 5) THEN
      RAISE EXCEPTION 'slot_number must be 1..5';
    END IF;
  ELSIF NEW.shelf = 'drawer' THEN
    IF NEW.shape IS NOT NULL OR NEW.slot_number IS NOT NULL OR NEW.shelf_color IS NOT NULL THEN
      RAISE EXCEPTION 'shape/slot_number/shelf_color must be null for drawer';
    END IF;
    IF NEW.drawer_number IS NOT NULL AND (NEW.drawer_number < 1 OR NEW.drawer_number > 4) THEN
      RAISE EXCEPTION 'drawer_number must be 1..4';
    END IF;
  ELSIF NEW.shelf = 'on_demand' OR NEW.shelf IS NULL THEN
    NEW.shape := NULL;
    NEW.slot_number := NULL;
    NEW.drawer_number := NULL;
    NEW.drawer_letter := NULL;
    NEW.shelf_color := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_bgg_game_location ON public.bgg_games;
CREATE TRIGGER trg_validate_bgg_game_location
BEFORE INSERT OR UPDATE ON public.bgg_games
FOR EACH ROW EXECUTE FUNCTION public.validate_bgg_game_location();
