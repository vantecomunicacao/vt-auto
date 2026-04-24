ALTER TABLE stores ADD COLUMN IF NOT EXISTS favicon_url TEXT;

COMMENT ON COLUMN stores.favicon_url IS 'URL pública do favicon da vitrine (PNG ou ICO, normalmente 32x32 ou 64x64)';
