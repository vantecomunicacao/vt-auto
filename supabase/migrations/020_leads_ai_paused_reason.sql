-- Motivo pelo qual o agente foi pausado para este lead
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ai_paused_reason TEXT
    CHECK (ai_paused_reason IN ('transbordo', 'encerramento', 'manual'));
