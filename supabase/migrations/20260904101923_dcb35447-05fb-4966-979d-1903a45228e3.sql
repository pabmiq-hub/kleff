DROP VIEW IF EXISTS public.kon_events_public;
CREATE VIEW public.kon_events_public AS
SELECT id, name, slug, date, status, language, event_time, event_location,
  organizer_profile_id, organizer_id, module,
  current_round, rounds, custom_age_ranges, custom_genders, custom_preferences,
  custom_dating_preferences, registration_requirements_enabled, slot_quotas,
  quota_waitlist_enabled, registration_subtitle, registration_description,
  professional_config, custom_registration_form, registration_open,
  waitlist_enabled, wrapped_enabled, wrapped_questions, languages_enabled,
  available_languages, selection_deadline_hours, selection_closed_at,
  scheduled_email_at, checkin_opens_minutes_before, checkin_open,
  repeat_request_enabled, crush_enabled, super_like_enabled, round_duration,
  table_size, participants_count, round_started_at, round_paused_at,
  round_elapsed_seconds, group_rounds, draft_round, payment_tracking_enabled,
  public_preliminary_tables_available AS has_preliminary_tables,
  social_game
FROM public.kon_events;
ALTER VIEW public.kon_events_public SET (security_invoker = off);
GRANT SELECT ON public.kon_events_public TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.kon_organizers_public;
CREATE VIEW public.kon_organizers_public AS
SELECT id, user_id, company_name, logo_url, slug, status
FROM public.kon_organizers;
ALTER VIEW public.kon_organizers_public SET (security_invoker = off);
GRANT SELECT ON public.kon_organizers_public TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.kon_organizer_branding_public;
CREATE VIEW public.kon_organizer_branding_public AS
SELECT id, organizer_id, primary_color, secondary_color, background_color,
  font_family, custom_welcome_text, custom_footer_text, is_white_label,
  hide_konektum_branding
FROM public.kon_organizer_branding;
ALTER VIEW public.kon_organizer_branding_public SET (security_invoker = off);
GRANT SELECT ON public.kon_organizer_branding_public TO anon, authenticated, service_role;