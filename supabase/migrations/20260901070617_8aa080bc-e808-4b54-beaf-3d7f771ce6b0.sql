ALTER TYPE shelf_shape ADD VALUE IF NOT EXISTS 'circle';
ALTER TYPE shelf_shape ADD VALUE IF NOT EXISTS 'star';

ALTER TABLE public.bgg_games ADD COLUMN IF NOT EXISTS in_drawer boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.validate_bgg_game_location()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.shelf IN ('A','B','C','D','1','2','3','4') THEN
    IF NEW.in_drawer THEN
      IF NEW.drawer_number IS NOT NULL AND (NEW.drawer_number < 1 OR NEW.drawer_number > 9) THEN
        RAISE EXCEPTION 'drawer_number must be 1..9';
      END IF;
      NEW.slot_number := NULL;
    ELSE
      IF NEW.drawer_number IS NOT NULL OR NEW.drawer_letter IS NOT NULL THEN
        RAISE EXCEPTION 'drawer_* must be null for shelf A-D without drawer';
      END IF;
      IF NEW.slot_number IS NOT NULL AND (NEW.slot_number < 1 OR NEW.slot_number > 5) THEN
        RAISE EXCEPTION 'slot_number must be 1..5';
      END IF;
    END IF;
  ELSIF NEW.shelf = 'drawer' THEN
    NEW.in_drawer := true;
    IF NEW.slot_number IS NOT NULL THEN
      RAISE EXCEPTION 'slot_number must be null for drawer';
    END IF;
    IF NEW.drawer_number IS NOT NULL AND (NEW.drawer_number < 1 OR NEW.drawer_number > 9) THEN
      RAISE EXCEPTION 'drawer_number must be 1..9';
    END IF;
  ELSIF NEW.shelf = 'on_demand' OR NEW.shelf IS NULL THEN
    NEW.shape := NULL;
    NEW.slot_number := NULL;
    NEW.drawer_number := NULL;
    NEW.drawer_letter := NULL;
    NEW.shelf_color := NULL;
    NEW.in_drawer := false;
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.bgg_games SET in_drawer = true WHERE shelf = 'drawer';