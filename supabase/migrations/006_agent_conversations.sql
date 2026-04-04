-- ============================================================
-- TABELA: agent_conversations
-- Histórico de mensagens WhatsApp com o agente IA
-- ============================================================

CREATE TABLE public.agent_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  lead_id    UUID REFERENCES public.leads(id) ON DELETE SET NULL,

  -- Identificação do cliente (número WhatsApp)
  phone      TEXT NOT NULL,

  -- Mensagem
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,

  -- Tokens usados (para controle de custo)
  tokens_in  INTEGER,
  tokens_out INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_agent_conversations_store_id ON public.agent_conversations(store_id);
CREATE INDEX idx_agent_conversations_lead_id ON public.agent_conversations(lead_id);
CREATE INDEX idx_agent_conversations_phone ON public.agent_conversations(store_id, phone);
CREATE INDEX idx_agent_conversations_created_at ON public.agent_conversations(created_at DESC);

-- RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- Owner vê todas as conversas da loja
CREATE POLICY "conversations_select_owner" ON public.agent_conversations
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'owner'
  );

-- Seller vê apenas conversas dos seus leads
CREATE POLICY "conversations_select_seller" ON public.agent_conversations
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'seller'
    AND lead_id IN (
      SELECT id FROM public.leads
      WHERE assigned_to = auth.uid()
    )
  );

-- Apenas service_role pode inserir (N8n usa service key)
CREATE POLICY "conversations_insert_service" ON public.agent_conversations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.agent_conversations IS 'Histórico de conversas do agente IA via WhatsApp';

-- ============================================================
-- AUTH HOOK: Custom JWT Claims
-- Adiciona store_id e role no token JWT do usuário
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims JSONB;
  store_user RECORD;
BEGIN
  claims := event -> 'claims';

  -- Busca vínculo do usuário com a loja
  SELECT su.store_id, su.role, u.raw_user_meta_data ->> 'is_master' AS is_master
  INTO store_user
  FROM public.store_users su
  JOIN auth.users u ON u.id = su.user_id
  WHERE su.user_id = (event ->> 'user_id')::UUID
    AND su.is_active = true
  LIMIT 1;

  IF FOUND THEN
    claims := jsonb_set(claims, '{store_id}', to_jsonb(store_user.store_id::TEXT));
    claims := jsonb_set(claims, '{role}', to_jsonb(store_user.role));
  END IF;

  -- Adiciona is_master se aplicável
  IF (event -> 'user_metadata' ->> 'is_master')::BOOLEAN = true THEN
    claims := jsonb_set(claims, '{is_master}', 'true'::JSONB);
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Permissão para o hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
