
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users upload own covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read posts media" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Users upload own post media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own post media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
