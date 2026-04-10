-- ============================================================
-- TABELA: agent_logs
-- Logs de execução do agente IA por etapa (observabilidade)
-- ============================================================

CREATE TABLE public.agent_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  -- Agrupa todos os passos de um único processamento de mensagem
  session_id  TEXT NOT NULL,
  phone       TEXT NOT NULL,

  -- Etapa: webhook_received | store_loaded | history_loaded | openai_called | response_sent | error
  step        TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('ok', 'error')),

  -- Detalhes da etapa (tokens, preview da mensagem, etc.)
  data        JSONB,
  duration_ms INTEGER,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_store_id   ON public.agent_logs(store_id);
CREATE INDEX idx_agent_logs_session_id ON public.agent_logs(session_id);
CREATE INDEX idx_agent_logs_created_at ON public.agent_logs(created_at DESC);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Apenas service_role insere (o serviço do agente usa SUPABASE_SERVICE_KEY)
CREATE POLICY "logs_insert_service" ON public.agent_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Owner vê os logs da própria loja
CREATE POLICY "logs_select_owner" ON public.agent_logs
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'owner'
  );

COMMENT ON TABLE public.agent_logs IS 'Logs de execução do agente IA por etapa';
