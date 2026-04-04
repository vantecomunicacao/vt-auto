-- ============================================================
-- TABELA: vehicles
-- Estoque de veículos de cada loja
-- ============================================================

CREATE TABLE public.vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  -- Identificação
  slug            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'sold', 'reserved', 'inactive')),
  featured        BOOLEAN NOT NULL DEFAULT false,

  -- Dados gerais
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  version         TEXT,
  year_model      INTEGER NOT NULL,
  year_manuf      INTEGER NOT NULL,
  color           TEXT NOT NULL,
  mileage         INTEGER NOT NULL DEFAULT 0,
  fuel            TEXT NOT NULL CHECK (fuel IN ('flex', 'gasoline', 'diesel', 'electric', 'hybrid', 'gas')),
  transmission    TEXT NOT NULL CHECK (transmission IN ('manual', 'automatic', 'automated', 'cvt')),
  body_type       TEXT CHECK (body_type IN ('sedan', 'hatch', 'suv', 'pickup', 'van', 'convertible', 'coupe', 'station_wagon', 'minivan', 'motorcycle', 'truck', 'other')),
  doors           INTEGER CHECK (doors IN (2, 4)),
  seats           INTEGER,
  engine          TEXT,  -- Ex: "1.0 TSI"
  power           TEXT,  -- Ex: "128cv"
  torque          TEXT,  -- Ex: "20kgfm"

  -- Preço
  price           NUMERIC(12,2) NOT NULL,
  price_old       NUMERIC(12,2),
  price_negotiable BOOLEAN NOT NULL DEFAULT true,
  fipe_code       TEXT,
  fipe_source     TEXT, -- 'manual' | 'api' (para migração futura)

  -- Opcionais (array de strings)
  features        TEXT[] NOT NULL DEFAULT '{}',

  -- Descrição
  description     TEXT,
  internal_notes  TEXT, -- visível só no painel

  -- Foto de capa (url da imagem principal)
  cover_image_url TEXT,

  -- Metadados
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_vehicles_store_id ON public.vehicles(store_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_slug ON public.vehicles(store_id, slug);
CREATE INDEX idx_vehicles_featured ON public.vehicles(featured);
CREATE INDEX idx_vehicles_brand_model ON public.vehicles(brand, model);

-- Slug único por loja
CREATE UNIQUE INDEX idx_vehicles_slug_unique ON public.vehicles(store_id, slug);

-- Função para gerar slug do veículo
CREATE OR REPLACE FUNCTION generate_vehicle_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gera o slug base: marca-modelo-ano-cor (tudo minúsculo, sem acento)
  base_slug := LOWER(
    REGEXP_REPLACE(
      UNACCENT(NEW.brand || '-' || NEW.model || '-' || NEW.year_model::TEXT || '-' || NEW.color),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  base_slug := TRIM(BOTH '-' FROM base_slug);
  final_slug := base_slug;

  -- Garante unicidade dentro da loja
  WHILE EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE store_id = NEW.store_id AND slug = final_slug AND id != NEW.id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Instala a extensão unaccent se não existir
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Trigger para gerar slug automaticamente
CREATE TRIGGER vehicles_generate_slug
  BEFORE INSERT OR UPDATE OF brand, model, year_model, color ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION generate_vehicle_slug();

-- Trigger updated_at
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Leitura pública (vitrine) — veículos available e da loja correta
CREATE POLICY "vehicles_select_public" ON public.vehicles
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    OR status = 'available'
  );

-- Owners e sellers podem criar
CREATE POLICY "vehicles_insert_staff" ON public.vehicles
  FOR INSERT WITH CHECK (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

-- Owners e sellers podem editar
CREATE POLICY "vehicles_update_staff" ON public.vehicles
  FOR UPDATE USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

-- Só owner pode deletar
CREATE POLICY "vehicles_delete_owner" ON public.vehicles
  FOR DELETE USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'owner'
  );

COMMENT ON TABLE public.vehicles IS 'Estoque de veículos por loja';
