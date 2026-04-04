-- ============================================================
-- TABELA: stores
-- Dados de cada loja contratante
-- ============================================================

CREATE TABLE public.stores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados da loja
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  phone           TEXT,
  email           TEXT,
  city            TEXT,
  state           CHAR(2),
  address         TEXT,
  description     TEXT,

  -- Visual
  logo_url        TEXT,
  primary_color   TEXT NOT NULL DEFAULT '#2563EB',
  secondary_color TEXT NOT NULL DEFAULT '#1E40AF',
  layout          TEXT NOT NULL DEFAULT 'classic' CHECK (layout IN ('classic', 'modern', 'marketplace')),

  -- Domínio customizado
  custom_domain   TEXT UNIQUE,

  -- Plano e status
  plan            TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'pro', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,

  -- Configurações do agente IA
  agent_active    BOOLEAN NOT NULL DEFAULT false,
  agent_name      TEXT NOT NULL DEFAULT 'AutoAgente',
  agent_prompt    TEXT,
  agent_tone      TEXT NOT NULL DEFAULT 'professional' CHECK (agent_tone IN ('professional', 'friendly', 'casual')),
  agent_greeting  TEXT,
  agent_hours     JSONB, -- { mon: {start: "08:00", end: "18:00"}, ... }
  whatsapp_instance TEXT, -- ID da instância no Evolution API

  -- Onboarding
  onboarding_completo BOOLEAN NOT NULL DEFAULT false,
  onboarding_step     INTEGER NOT NULL DEFAULT 1,

  -- Metadados
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_stores_custom_domain ON public.stores(custom_domain);
CREATE INDEX idx_stores_is_active ON public.stores(is_active);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Owners/sellers veem apenas sua própria loja
CREATE POLICY "stores_select_own" ON public.stores
  FOR SELECT USING (
    id = (auth.jwt() ->> 'store_id')::UUID
  );

-- Só o owner pode atualizar
CREATE POLICY "stores_update_own" ON public.stores
  FOR UPDATE USING (
    id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'owner'
  );

-- Comentário
COMMENT ON TABLE public.stores IS 'Lojas contratantes da plataforma AutoAgente';
