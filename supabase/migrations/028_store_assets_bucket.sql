-- ============================================================
-- STORAGE: Bucket store-assets
-- Para logos, banners, favicons e outras mídias de branding da loja.
-- Path: store-assets/{store_id}/{kind}/{filename}
--   kind ∈ ('logo', 'banner', 'favicon')
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT DO NOTHING;

-- Upload: apenas usuários autenticados (a API valida store_id no server)
CREATE POLICY "store_assets_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets'
    AND auth.role() = 'authenticated'
  );

-- Leitura: pública (as imagens ficam embutidas na vitrine)
CREATE POLICY "store_assets_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

-- Delete: apenas autenticados (a API valida staff da loja)
CREATE POLICY "store_assets_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'store-assets'
    AND auth.role() = 'authenticated'
  );
