ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS agent_vehicle_format TEXT;
