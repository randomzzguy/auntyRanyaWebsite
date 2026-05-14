-- Run this in your Supabase SQL Editor (idempotent — safe to re-run)

-- 1. Create the product-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  false,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Enable RLS on storage.objects (usually already enabled, but safe to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing storage policies so re-runs are safe
DO $$ BEGIN
  DROP POLICY IF EXISTS "product-images_public_select" ON storage.objects;
  DROP POLICY IF EXISTS "product-images_auth_insert" ON storage.objects;
  DROP POLICY IF EXISTS "product-images_auth_update" ON storage.objects;
  DROP POLICY IF EXISTS "product-images_auth_delete" ON storage.objects;
END $$;

-- 4. Allow anyone to read product images
CREATE POLICY "product-images_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 5. Allow authenticated users to upload product images
--    (Frontend checks admin status; storage accepts uploads from any authenticated user.
--     If you want to restrict to admins only, use a storage helper function or restrict via app logic.)
CREATE POLICY "product-images_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 6. Allow authenticated users to update their own uploads
CREATE POLICY "product-images_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND owner = auth.uid());

-- 7. Allow authenticated users to delete their own uploads
CREATE POLICY "product-images_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND owner = auth.uid());
