-- Rebrand: AutoAgente -> CarGrow
-- Mantém valores existentes em stores.agent_name; apenas troca o DEFAULT para novas lojas.

ALTER TABLE public.stores
  ALTER COLUMN agent_name SET DEFAULT 'CarGrow';

COMMENT ON TABLE public.stores IS 'Lojas contratantes da plataforma CarGrow';
