
DROP POLICY IF EXISTS "Content insert by social media team" ON public.content_library;
DROP POLICY IF EXISTS "Content delete by uploader" ON public.content_library;

CREATE POLICY "Content insert by social or events manager"
ON public.content_library FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND (
    public.get_user_team(auth.uid()) = 'social_media'
    OR public.get_user_role(auth.uid()) = 'events_manager'
  )
);

CREATE POLICY "Content delete by uploader or events manager"
ON public.content_library FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid()
  OR public.get_user_role(auth.uid()) = 'events_manager'
);
