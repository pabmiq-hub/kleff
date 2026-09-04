CREATE TABLE public.kon_crush_requests (
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  responded_at timestamptz,
  scheduled_round integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  target_id uuid NOT NULL,
  token text NOT NULL,
  CONSTRAINT crush_requests_one_per_event UNIQUE (event_id, requester_id),
  CONSTRAINT crush_requests_no_self CHECK (requester_id <> target_id)
);

CREATE TABLE public.kon_email_logs (
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_type TEXT NOT NULL,
  error_message text,
  event_id UUID NOT NULL,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL,
  sent_at TIMESTAMPTZ,
  status text NOT NULL DEFAULT 'sent'
);

CREATE TABLE public.kon_event_series (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  organizer_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kon_event_waitlist (
  age_range text,
  birth_date date,
  company_name text,
  company_size text,
  created_at timestamptz NOT NULL DEFAULT now(),
  dating_preference text,
  email text NOT NULL,
  entity_type text,
  event_id uuid NOT NULL,
  game_answers jsonb,
  gender text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_returning_participant boolean DEFAULT false,
  marketing_consent boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  needs text[],
  phone text,
  position integer NOT NULL DEFAULT 0,
  preference text,
  preferred_age_range text,
  promoted_at timestamptz,
  sector text,
  solutions text[],
  spoken_languages text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'waiting',
  wrapped_answers jsonb,
  UNIQUE (event_id, email)
);

CREATE TABLE public.kon_events (
  available_languages text[] NOT NULL DEFAULT ARRAY['Castellano','Català','English','Portugués','Français']::text[],
  avoid_encounters_mode text NOT NULL DEFAULT 'preference',
  avoid_previous_encounters boolean NOT NULL DEFAULT false,
  checkin_open boolean DEFAULT false,
  checkin_opens_minutes_before integer DEFAULT 60,
  code_send_mode text NOT NULL DEFAULT 'on_registration',
  completed_rounds integer[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  crush_enabled boolean NOT NULL DEFAULT false,
  current_round integer DEFAULT 0,
  custom_age_ranges jsonb,
  custom_dating_preferences jsonb,
  custom_genders jsonb,
  custom_preferences jsonb,
  custom_registration_form jsonb DEFAULT NULL,
  custom_tables jsonb,
  date date NOT NULL,
  draft_round integer,
  email_template jsonb,
  emails_sent_at timestamptz,
  event_location text DEFAULT NULL,
  event_time text DEFAULT NULL,
  game_mode jsonb,
  gender_parity boolean DEFAULT false,
  group_rounds jsonb DEFAULT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_test_event boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'es',
  languages_enabled boolean NOT NULL DEFAULT false,
  module text DEFAULT 'social',
  name text NOT NULL,
  organizer_id uuid,
  organizer_profile_id uuid,
  original_participants_count integer DEFAULT NULL,
  participants_count integer NOT NULL DEFAULT 0,
  payment_reminder_first_hours integer NOT NULL DEFAULT 24,
  payment_reminder_second_hours integer,
  payment_reminders_enabled boolean NOT NULL DEFAULT false,
  payment_tracking_enabled boolean NOT NULL DEFAULT false,
  preliminary_round jsonb DEFAULT NULL,
  professional_config jsonb,
  public_preliminary_tables_available boolean NOT NULL DEFAULT false,
  quota_waitlist_enabled boolean NOT NULL DEFAULT true,
  registration_description text DEFAULT NULL,
  registration_open boolean NOT NULL DEFAULT true,
  registration_requirements_enabled boolean DEFAULT false,
  registration_subtitle text DEFAULT NULL,
  reminder_mode text NOT NULL DEFAULT 'manual',
  reminder_scheduled_at timestamptz DEFAULT NULL,
  repeat_request_enabled boolean NOT NULL DEFAULT false,
  rotation_mode text NOT NULL DEFAULT 'fixed_host',
  round_duration integer NOT NULL DEFAULT 300,
  round_elapsed_seconds integer DEFAULT 0,
  round_paused_at timestamptz DEFAULT NULL,
  round_started_at timestamptz DEFAULT NULL,
  rounds integer NOT NULL DEFAULT 3,
  scheduled_email_at timestamptz DEFAULT NULL,
  selection_closed_at timestamptz DEFAULT NULL,
  selection_deadline_hours integer DEFAULT 48,
  series_id uuid,
  slot_quotas jsonb DEFAULT '[]'::jsonb,
  social_game jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed')),
  super_like_enabled boolean NOT NULL DEFAULT false,
  table_size integer NOT NULL DEFAULT 4,
  tables jsonb,
  tables_generation_mode text NOT NULL DEFAULT 'upfront' CHECK (tables_generation_mode IN ('upfront','per_round')),
  test_config jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  waitlist_enabled boolean NOT NULL DEFAULT false,
  wrapped_enabled boolean NOT NULL DEFAULT false,
  wrapped_questions jsonb
);

CREATE TABLE public.kon_features (
  category text,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  description text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL DEFAULT 'core',
  name text NOT NULL
);

CREATE TABLE public.kon_game_rewards (
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  game_code text NOT NULL DEFAULT 'who_is_who',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id uuid NOT NULL,
  reward_type text NOT NULL,
  round integer NOT NULL,
  UNIQUE (event_id, participant_id, round, reward_type)
);

CREATE TABLE public.kon_game_sessions (
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  game_code text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ready_participant_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  round integer NOT NULL,
  started_at timestamptz,
  status text NOT NULL DEFAULT 'lobby',
  table_number integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, round, table_number, game_code)
);

CREATE TABLE public.kon_game_votes (
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  game_code text NOT NULL DEFAULT 'who_is_who',
  guessed_participant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_correct boolean NOT NULL,
  question_id text NOT NULL,
  round integer NOT NULL,
  target_participant_id uuid NOT NULL,
  voter_participant_id uuid NOT NULL,
  UNIQUE (event_id, round, voter_participant_id, question_id, target_participant_id)
);

CREATE TABLE public.kon_global_participants (
  created_at timestamptz NOT NULL DEFAULT now(),
  display_name text NOT NULL,
  email text,
  events_attended integer NOT NULL DEFAULT 0,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id uuid NOT NULL,
  phone text,
  source_notes text,
  status text NOT NULL DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kon_unique_organizer_email UNIQUE NULLS NOT DISTINCT (organizer_id, email),
  CONSTRAINT kon_unique_organizer_phone UNIQUE NULLS NOT DISTINCT (organizer_id, phone),
  CONSTRAINT kon_email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE public.kon_modules (
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  description text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  name text NOT NULL,
  requires_plans text[]
);

CREATE TABLE public.kon_organizer_branding (
  background_color text DEFAULT '#FFFFFF',
  created_at timestamptz DEFAULT now(),
  custom_footer_text text,
  custom_welcome_text text,
  font_family text DEFAULT 'Outfit',
  hide_konektum_branding boolean NOT NULL DEFAULT false,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_white_label boolean NOT NULL DEFAULT false,
  organizer_id uuid NOT NULL,
  primary_color text DEFAULT '#8B5CF6',
  secondary_color text DEFAULT '#EC4899',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (organizer_id)
);

CREATE TABLE public.kon_organizer_email_connections (
  access_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  email_address text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  organizer_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'gmail',
  refresh_token text NOT NULL,
  token_expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id, provider)
);

CREATE TABLE public.kon_organizer_features (
  created_at timestamptz DEFAULT now(),
  feature_code text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT true,
  organizer_id uuid NOT NULL,
  UNIQUE (organizer_id, feature_code)
);

CREATE TABLE public.kon_organizer_resend_config (
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_verified boolean NOT NULL DEFAULT false,
  organizer_id uuid NOT NULL,
  resend_api_key text NOT NULL,
  sender_email text NOT NULL,
  sender_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id)
);

CREATE TABLE public.kon_organizer_templates (
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  description text,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_default boolean DEFAULT false,
  name text NOT NULL,
  organizer_id uuid NOT NULL,
  subtype text,
  type text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1
);

CREATE TABLE public.kon_organizer_verified_domains (
  created_at timestamptz NOT NULL DEFAULT now(),
  dns_records jsonb DEFAULT '[]'::jsonb,
  domain text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  resend_domain_id text,
  sender_email text,
  sender_name text,
  status text NOT NULL DEFAULT 'pending',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id)
);

CREATE TABLE public.kon_organizers (
  active_modules text[] DEFAULT '{}',
  company_name text,
  contact_email text NOT NULL,
  contact_phone text,
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  plan_id uuid,
  slug text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  stripe_customer_id text,
  subscription_ends_at timestamptz,
  subscription_starts_at timestamptz,
  trial_ends_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL UNIQUE,
  CONSTRAINT kon_organizers_valid_status CHECK (status IN ('pending','active','suspended','cancelled'))
);

CREATE TABLE public.kon_participant_avatars (
  created_at timestamptz NOT NULL DEFAULT now(),
  drawing text,
  email text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layers jsonb NOT NULL DEFAULT '{}'::jsonb,
  organizer_id uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id, email)
);

CREATE TABLE public.kon_participant_encounters (
  encountered_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  global_participant_1_id uuid NOT NULL,
  global_participant_2_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id uuid NOT NULL,
  round_number integer NOT NULL,
  table_number integer NOT NULL,
  CONSTRAINT kon_different_participants CHECK (global_participant_1_id <> global_participant_2_id),
  CONSTRAINT kon_ordered_participant_ids CHECK (global_participant_1_id < global_participant_2_id)
);

CREATE TABLE public.kon_participant_exclusions (
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  group_id uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id uuid NOT NULL,
  participant_2_id uuid NOT NULL,
  reason text
);

CREATE TABLE public.kon_participant_inclusions (
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  group_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id uuid NOT NULL,
  participant_2_id uuid NOT NULL,
  reason text
);

CREATE TABLE public.kon_participant_selections (
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_super_like boolean NOT NULL DEFAULT false,
  selected_id uuid NOT NULL,
  selection_type text DEFAULT 'friendship',
  selector_id uuid NOT NULL,
  UNIQUE (event_id, selector_id, selected_id)
);

CREATE TABLE public.kon_participants (
  age integer,
  age_range text,
  birth_date date,
  business_interests text[],
  cancelled_at timestamptz,
  checked_in boolean DEFAULT false,
  company_name text,
  company_size text,
  created_at timestamptz NOT NULL DEFAULT now(),
  dating_preference text,
  email text,
  entity_type text,
  event_id uuid NOT NULL,
  game_answers jsonb,
  gender text,
  global_participant_id uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_fake boolean NOT NULL DEFAULT false,
  is_returning_participant boolean DEFAULT false,
  marketing_consent boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  needs text[],
  paid_at timestamptz,
  payment_last_reminder_at timestamptz,
  payment_reminder_count integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid',
  phone text,
  preference text,
  preferred_age_range text,
  sector text,
  selection_submitted_at timestamptz DEFAULT NULL,
  solutions text[],
  spoken_languages text[] NOT NULL DEFAULT ARRAY[]::text[],
  verification_code text,
  verification_email_sent_at timestamptz,
  wrapped_profile_id uuid
);

CREATE TABLE public.kon_plan_features (
  feature_code text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_limited boolean DEFAULT false,
  limit_value integer,
  plan_id uuid NOT NULL,
  UNIQUE (plan_id, feature_code)
);

CREATE TABLE public.kon_remarketing_campaigns (
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  recipients_count integer DEFAULT 0,
  recipients_filter jsonb DEFAULT '{}',
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  subject text NOT NULL,
  target_event_id uuid,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.kon_remarketing_recipients (
  campaign_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  email text NOT NULL,
  error_message text,
  global_participant_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
);

CREATE TABLE public.kon_repeat_requests (
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  expires_at timestamptz,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  scheduled_round integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired','fulfilled')),
  target_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  CHECK (requester_id <> target_id)
);

CREATE TABLE public.kon_subscription_plans (
  created_at timestamptz DEFAULT now(),
  description text,
  display_name text NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  max_active_events integer,
  max_events integer,
  max_participants_per_event integer,
  name text NOT NULL UNIQUE,
  price_monthly numeric(10,2) DEFAULT 0,
  price_yearly numeric(10,2) DEFAULT 0,
  sort_order integer DEFAULT 0,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text
);

CREATE TABLE public.kon_template_versions (
  changed_by text,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  version integer NOT NULL
);

CREATE TABLE public.kon_wrapped_profiles (
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  hobbies_ranked text[] NOT NULL DEFAULT ARRAY[]::text[],
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id, email)
);

CREATE TABLE public.kon_wrapped_table_requests (
  compatibility_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_participant_id uuid NOT NULL,
  responded_at timestamptz,
  sender_participant_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  UNIQUE (event_id, sender_participant_id, receiver_participant_id)
);

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('crush_requests','event_id','events','CASCADE'),
    ('crush_requests','requester_id','participants','CASCADE'),
    ('crush_requests','target_id','participants','CASCADE'),
    ('email_logs','event_id','events','CASCADE'),
    ('email_logs','participant_id','participants','CASCADE'),
    ('event_series','organizer_id','organizers','CASCADE'),
    ('event_waitlist','event_id','events','CASCADE'),
    ('events','series_id','event_series','SET NULL'),
    ('game_rewards','event_id','events','CASCADE'),
    ('game_rewards','participant_id','participants','CASCADE'),
    ('game_sessions','event_id','events','CASCADE'),
    ('game_votes','event_id','events','CASCADE'),
    ('game_votes','guessed_participant_id','participants','CASCADE'),
    ('game_votes','target_participant_id','participants','CASCADE'),
    ('game_votes','voter_participant_id','participants','CASCADE'),
    ('global_participants','organizer_id','organizers','CASCADE'),
    ('organizer_branding','organizer_id','organizers','CASCADE'),
    ('organizer_email_connections','organizer_id','organizers','CASCADE'),
    ('organizer_features','organizer_id','organizers','CASCADE'),
    ('organizer_resend_config','organizer_id','organizers','CASCADE'),
    ('organizer_templates','organizer_id','organizers','CASCADE'),
    ('organizer_verified_domains','organizer_id','organizers','CASCADE'),
    ('organizers','plan_id','subscription_plans','NO ACTION'),
    ('participant_encounters','event_id','events','CASCADE'),
    ('participant_encounters','global_participant_1_id','global_participants','CASCADE'),
    ('participant_encounters','global_participant_2_id','global_participants','CASCADE'),
    ('participant_exclusions','event_id','events','CASCADE'),
    ('participant_exclusions','participant_1_id','participants','CASCADE'),
    ('participant_exclusions','participant_2_id','participants','CASCADE'),
    ('participant_inclusions','event_id','events','CASCADE'),
    ('participant_inclusions','participant_1_id','participants','CASCADE'),
    ('participant_inclusions','participant_2_id','participants','CASCADE'),
    ('participant_selections','event_id','events','CASCADE'),
    ('participant_selections','selected_id','participants','CASCADE'),
    ('participant_selections','selector_id','participants','CASCADE'),
    ('participants','event_id','events','CASCADE'),
    ('participants','global_participant_id','global_participants','SET NULL'),
    ('participants','wrapped_profile_id','wrapped_profiles','SET NULL'),
    ('plan_features','plan_id','subscription_plans','CASCADE'),
    ('remarketing_campaigns','target_event_id','events','SET NULL'),
    ('remarketing_recipients','campaign_id','remarketing_campaigns','CASCADE'),
    ('remarketing_recipients','global_participant_id','global_participants','SET NULL'),
    ('repeat_requests','event_id','events','CASCADE'),
    ('repeat_requests','requester_id','participants','CASCADE'),
    ('repeat_requests','target_id','participants','CASCADE'),
    ('template_versions','template_id','organizer_templates','CASCADE'),
    ('wrapped_table_requests','event_id','events','CASCADE'),
    ('wrapped_table_requests','receiver_participant_id','participants','CASCADE'),
    ('wrapped_table_requests','sender_participant_id','participants','CASCADE')
  ) AS v(tab, col, ref, act) LOOP
    EXECUTE format('ALTER TABLE public.kon_%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.kon_%I(id) ON DELETE %s',
      r.tab, 'kon_' || r.tab || '_' || r.col || '_fkey', r.col, r.ref, r.act);
  END LOOP;
END $$;

DO $$
DECLARE t text; c text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crush_requests','email_logs','event_series','event_waitlist','events','features','game_rewards','game_sessions','game_votes','global_participants','modules','organizer_branding','organizer_email_connections','organizer_features','organizer_resend_config','organizer_templates','organizer_verified_domains','organizers','participant_avatars','participant_encounters','participant_exclusions','participant_inclusions','participant_selections','participants','plan_features','remarketing_campaigns','remarketing_recipients','repeat_requests','subscription_plans','template_versions','wrapped_profiles','wrapped_table_requests'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.kon_%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.kon_%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.kon_%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY kon_admin_all ON public.kon_%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''super_admin'')) WITH CHECK (public.has_role(auth.uid(), ''super_admin''))', t);
    FOR c IN SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kon_' || t AND column_name LIKE '%\_id' LOOP
      EXECUTE format('CREATE INDEX %I ON public.kon_%I (%I)', 'kon_' || t || '_' || c || '_idx', t, c);
    END LOOP;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kon_' || t AND column_name = 'updated_at') THEN
      EXECUTE format('CREATE TRIGGER kon_%I_updated_at BEFORE UPDATE ON public.kon_%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
    END IF;
  END LOOP;
END $$;