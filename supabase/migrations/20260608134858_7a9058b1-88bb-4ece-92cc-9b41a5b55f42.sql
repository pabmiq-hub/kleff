
CREATE POLICY "Anyone can upload registration files" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'registration-uploads');
CREATE POLICY "Admins can read registration files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'registration-uploads' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can delete registration files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'registration-uploads' AND public.has_role(auth.uid(), 'super_admin'));
