-- ============================================================
-- TABELA: leads
-- Contatos captados pelo agente ou formulários da vitrine
-- ============================================================

CREATE TABLE public.leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  assigned_to  UUID REFERENCES auth.users(id),

  -- Dados do cliente
  name         TEXT,
  phone        TEXT NOT NULL,
  email        TEXT,

  -- Contexto
  vehicle_id   UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_interest TEXT, -- descrição livre caso não haja veículo vinculado
  source       TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'vitrine', 'manual')),

  -- Status do funil
  status       TEXT NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new', 'in_progress', 'qualified', 'converted', 'lost')),

  -- Notas internas
  notes        TEXT,

  -- Metadados
  last_contact_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_leads_store_id ON public.leads(store_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_phone ON public.leads(store_id, phone);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Owner vê todos os leads da loja
CREATE POLICY "leads_select_owner" ON public.leads
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'owner'
  );

-- Seller vê apenas os leads atribuídos a ele
CREATE POLICY "leads_select_seller" ON public.leads
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'seller'
    AND assigned_to = auth.uid()
  );

-- Qualquer membro da loja pode criar leads
CREATE POLICY "leads_insert_staff" ON public.leads
  FOR INSERT WITH CHECK (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

-- Owner pode atualizar qualquer lead
CREATE POLICY "leads_update_owner" ON public.leads
  FOR UPDATE USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'owner'
  );

-- Seller pode atualizar apenas seus leads
CREATE POLICY "leads_update_seller" ON public.leads
  FOR UPDATE USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'seller'
    AND assigned_to = auth.uid()
  );

COMMENT ON TABLE public.leads IS 'Leads captados pelo agente IA ou formulários da vitrine';
