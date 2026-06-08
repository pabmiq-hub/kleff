
CREATE TABLE public.registration_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_es TEXT NOT NULL DEFAULT '',
  title_ca TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_es TEXT,
  description_ca TEXT,
  description_en TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  external_mode TEXT CHECK (external_mode IN ('redirect','iframe')),
  external_url TEXT,
  payment_required BOOLEAN NOT NULL DEFAULT false,
  payment_amount_cents INTEGER,
  payment_currency TEXT NOT NULL DEFAULT 'EUR',
  payment_instructions TEXT,
  max_responses INTEGER,
  closes_at TIMESTAMPTZ,
  confirmation_message_es TEXT,
  confirmation_message_ca TEXT,
  confirmation_message_en TEXT,
  notify_emails TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.registration_forms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.registration_forms TO authenticated;
GRANT ALL ON public.registration_forms TO service_role;
ALTER TABLE public.registration_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published forms" ON public.registration_forms FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can read all forms" ON public.registration_forms FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage forms" ON public.registration_forms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER registration_forms_set_updated_at BEFORE UPDATE ON public.registration_forms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.registration_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.registration_forms(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('text','textarea','email','phone','number','select','checkbox','radio','date','file')),
  required BOOLEAN NOT NULL DEFAULT false,
  label_es TEXT NOT NULL DEFAULT '',
  label_ca TEXT NOT NULL DEFAULT '',
  label_en TEXT NOT NULL DEFAULT '',
  help_es TEXT,
  help_ca TEXT,
  help_en TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.registration_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.registration_questions TO authenticated;
GRANT ALL ON public.registration_questions TO service_role;
ALTER TABLE public.registration_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read questions of published forms" ON public.registration_questions FOR SELECT USING (EXISTS (SELECT 1 FROM public.registration_forms f WHERE f.id = form_id AND f.is_published = true));
CREATE POLICY "Admins read all questions" ON public.registration_questions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage questions" ON public.registration_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX registration_questions_form_idx ON public.registration_questions(form_id, position);
CREATE TRIGGER registration_questions_set_updated_at BEFORE UPDATE ON public.registration_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.registration_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.registration_forms(id) ON DELETE CASCADE,
  email_contact TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded','not_required')),
  internal_notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.registration_responses TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.registration_responses TO authenticated;
GRANT ALL ON public.registration_responses TO service_role;
ALTER TABLE public.registration_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit response to published forms" ON public.registration_responses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.registration_forms f WHERE f.id = form_id AND f.is_published = true AND (f.external_mode IS NULL)));
CREATE POLICY "Admins read responses" ON public.registration_responses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins update responses" ON public.registration_responses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins delete responses" ON public.registration_responses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX registration_responses_form_idx ON public.registration_responses(form_id, created_at DESC);
CREATE TRIGGER registration_responses_set_updated_at BEFORE UPDATE ON public.registration_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.registration_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.registration_responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.registration_questions(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.registration_files TO authenticated;
GRANT ALL ON public.registration_files TO service_role;
ALTER TABLE public.registration_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage files" ON public.registration_files FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
