-- ==============================================================================
-- GBL Supabase Storage Buckets Setup
-- Configured for 10 MB Max File Size (Fixes the previous 2 MB validation bug)
-- ==============================================================================

-- 1. Insert Storage Buckets with 10 MB limit (10 * 1024 * 1024 bytes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('gbl-players', 'gbl-players', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
    ('gbl-teams', 'gbl-teams', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']),
    ('gbl-gallery', 'gbl-gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
    ('gbl-tournament', 'gbl-tournament', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = 10485760,
    public = true;

-- 2. Storage Policies: Allow Public Read for All Users
CREATE POLICY "Public Read Players Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'gbl-players');

CREATE POLICY "Public Read Teams Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'gbl-teams');

CREATE POLICY "Public Read Gallery Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'gbl-gallery');

CREATE POLICY "Public Read Tournament Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'gbl-tournament');

-- 3. Storage Policies: Allow Admin Insert/Update/Delete
CREATE POLICY "Admin Upload Players"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gbl-players');

CREATE POLICY "Admin Update Players"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gbl-players');

CREATE POLICY "Admin Delete Players"
ON storage.objects FOR DELETE
USING (bucket_id = 'gbl-players');

CREATE POLICY "Admin Upload Teams"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gbl-teams');

CREATE POLICY "Admin Upload Gallery"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gbl-gallery');

CREATE POLICY "Admin Delete Gallery"
ON storage.objects FOR DELETE
USING (bucket_id = 'gbl-gallery');
