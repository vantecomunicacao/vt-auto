-- ============================================================
-- TABELA: vehicle_images
-- Fotos dos veículos (max 20 por veículo)
-- ============================================================

CREATE TABLE public.vehicle_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- /fotos/{store_id}/{vehicle_id}/{filename}
  url         TEXT NOT NULL,
  is_cover    BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);
CREATE INDEX idx_vehicle_images_store_id ON public.vehicle_images(store_id);

-- Garante no máximo 20 fotos por veículo
CREATE OR REPLACE FUNCTION check_vehicle_images_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.vehicle_images
    WHERE vehicle_id = NEW.vehicle_id
  ) >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 fotos por veículo atingido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_images_limit
  BEFORE INSERT ON public.vehicle_images
  FOR EACH ROW EXECUTE FUNCTION check_vehicle_images_limit();

-- Quando uma foto é marcada como capa, remove a capa das outras
CREATE OR REPLACE FUNCTION handle_cover_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_cover = true THEN
    UPDATE public.vehicle_images
    SET is_cover = false
    WHERE vehicle_id = NEW.vehicle_id AND id != NEW.id;

    -- Atualiza a cover_image_url no veículo
    UPDATE public.vehicles
    SET cover_image_url = NEW.url
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_images_cover
  AFTER INSERT OR UPDATE OF is_cover ON public.vehicle_images
  FOR EACH ROW EXECUTE FUNCTION handle_cover_image();

-- RLS
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Leitura pública para vitrine
CREATE POLICY "vehicle_images_select_public" ON public.vehicle_images
  FOR SELECT USING (true);

-- Insert/delete apenas por membros da loja
CREATE POLICY "vehicle_images_insert_staff" ON public.vehicle_images
  FOR INSERT WITH CHECK (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

CREATE POLICY "vehicle_images_delete_staff" ON public.vehicle_images
  FOR DELETE USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

CREATE POLICY "vehicle_images_update_staff" ON public.vehicle_images
  FOR UPDATE USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

-- ============================================================
-- STORAGE: Bucket vehicle-images
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT DO NOTHING;

-- Política de upload: apenas membros autenticados da loja
CREATE POLICY "vehicle_images_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-images'
    AND auth.role() = 'authenticated'
  );

-- Política de leitura: pública
CREATE POLICY "vehicle_images_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-images');

-- Política de delete: apenas membros autenticados
CREATE POLICY "vehicle_images_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vehicle-images'
    AND auth.role() = 'authenticated'
  );

COMMENT ON TABLE public.vehicle_images IS 'Imagens dos veículos (máx 20 por veículo)';
