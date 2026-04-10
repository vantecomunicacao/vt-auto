-- ============================================================
-- Configuração de follow-up e modelo OpenAI na tabela stores
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS follow_up_enabled  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_config   JSONB NOT NULL DEFAULT '{
    "intervals": [60, 1440, 4320],
    "messages": [
      "Olá! Ainda posso te ajudar com alguma informação sobre nossos veículos?",
      "Que tal agendar uma visita para conhecer nosso estoque pessoalmente?",
      "Última mensagem: temos novidades no estoque que podem te interessar!"
    ]
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS openai_model       TEXT NOT NULL DEFAULT 'gpt-4o-mini';
