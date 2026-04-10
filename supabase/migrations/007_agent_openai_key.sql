-- ============================================================
-- Adiciona campo openai_api_key na tabela stores
-- Cada loja configura sua própria chave OpenAI
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

COMMENT ON COLUMN public.stores.openai_api_key IS 'Chave da API OpenAI configurada pelo owner da loja';
