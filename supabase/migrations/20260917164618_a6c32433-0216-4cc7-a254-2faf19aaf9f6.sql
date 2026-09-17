ALTER TABLE public.kon_events
  ADD COLUMN IF NOT EXISTS table_gender_mode text NOT NULL DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS primary_target_gender text,
  ADD COLUMN IF NOT EXISTS secondary_slug text,
  ADD COLUMN IF NOT EXISTS secondary_registration_subtitle text,
  ADD COLUMN IF NOT EXISTS secondary_registration_description text,
  ADD COLUMN IF NOT EXISTS secondary_target_gender text;

DO $$ BEGIN
  ALTER TABLE public.kon_events ADD CONSTRAINT kon_events_table_gender_mode_check
    CHECK (table_gender_mode IN ('mixed','single_gender'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS kon_events_secondary_slug_key ON public.kon_events (secondary_slug) WHERE secondary_slug IS NOT NULL;

CREATE OR REPLACE VIEW public.kon_events_public AS
 SELECT id, name, slug, date, status, language, event_time, event_location,
    organizer_profile_id, organizer_id, module, current_round, rounds,
    custom_age_ranges, custom_genders, custom_preferences, custom_dating_preferences,
    registration_requirements_enabled, slot_quotas, quota_waitlist_enabled,
    registration_subtitle, registration_description, professional_config,
    custom_registration_form, registration_open, waitlist_enabled, wrapped_enabled,
    wrapped_questions, languages_enabled, available_languages, selection_deadline_hours,
    selection_closed_at, scheduled_email_at, checkin_opens_minutes_before, checkin_open,
    repeat_request_enabled, crush_enabled, super_like_enabled, round_duration, table_size,
    participants_count, round_started_at, round_paused_at, round_elapsed_seconds,
    group_rounds, draft_round, payment_tracking_enabled,
    public_preliminary_tables_available AS has_preliminary_tables,
    social_game,
    table_gender_mode, primary_target_gender,
    secondary_slug, secondary_registration_subtitle, secondary_registration_description, secondary_target_gender
   FROM kon_events;