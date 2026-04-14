-- ============================================================
-- Limite de mensagens do agente por lead por hora
-- Evita loop infinito quando um lead fica spammando
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS agent_rate_limit INTEGER NOT NULL DEFAULT 20;

COMMENT ON COLUMN public.stores.agent_rate_limit IS 'Máximo de respostas do agente por lead por hora. Default 20.';
