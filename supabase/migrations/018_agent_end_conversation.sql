-- Campos para configuração de encerramento de conversa
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS agent_end_prompt text,
  ADD COLUMN IF NOT EXISTS agent_stop_on_end boolean NOT NULL DEFAULT true;
