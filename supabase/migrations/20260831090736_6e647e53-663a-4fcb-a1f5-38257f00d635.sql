-- 1. Automatic weekly purge of pg_cron execution history (was 1.2 GB)
CREATE OR REPLACE FUNCTION public.purge_cron_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'purge_cron_history failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_cron_history() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('purge-cron-history', '17 4 * * 0', $cron$ SELECT public.purge_cron_history(); $cron$);

-- 2. Targeted indexes for the slowest read paths
CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx
  ON public.blog_posts (status, published_at DESC);

CREATE INDEX IF NOT EXISTS bgg_games_active_rating_idx
  ON public.bgg_games (bgg_rating DESC NULLS LAST)
  WHERE is_active = true;