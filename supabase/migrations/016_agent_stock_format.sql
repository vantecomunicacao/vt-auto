ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS agent_stock_format TEXT NOT NULL DEFAULT 'full';
