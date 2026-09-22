CREATE TABLE public.registration_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.registration_forms(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL DEFAULT '',
  blocks JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_registration_announcements_form ON public.registration_announcements(form_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_announcements TO authenticated;
GRANT ALL ON public.registration_announcements TO service_role;

ALTER TABLE public.registration_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage announcements"
  ON public.registration_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_registration_announcements_updated_at
  BEFORE UPDATE ON public.registration_announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();