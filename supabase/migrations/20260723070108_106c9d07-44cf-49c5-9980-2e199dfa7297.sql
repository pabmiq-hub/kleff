DROP POLICY "team_members public read" ON public.team_members;
CREATE POLICY "team_members public read active" ON public.team_members FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "team_members admin read all" ON public.team_members FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
GRANT SELECT ON public.team_members TO anon;