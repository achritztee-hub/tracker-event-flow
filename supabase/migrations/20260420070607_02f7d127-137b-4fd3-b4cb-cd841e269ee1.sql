
-- Reports bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Content library bucket (public for thumbnails/previews)
INSERT INTO storage.buckets (id, name, public) VALUES ('content-library', 'content-library', true)
ON CONFLICT (id) DO NOTHING;

-- Reports policies
CREATE POLICY "Reports bucket readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'reports');

CREATE POLICY "Reports bucket insert by authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reports' AND auth.uid() = owner);

CREATE POLICY "Reports bucket update by owner"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'reports' AND auth.uid() = owner);

CREATE POLICY "Reports bucket delete by owner"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reports' AND auth.uid() = owner);

-- Content library policies
CREATE POLICY "Content bucket public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-library');

CREATE POLICY "Content bucket insert by authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'content-library' AND auth.uid() = owner);

CREATE POLICY "Content bucket update by owner"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'content-library' AND auth.uid() = owner);

CREATE POLICY "Content bucket delete by owner"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'content-library' AND auth.uid() = owner);
