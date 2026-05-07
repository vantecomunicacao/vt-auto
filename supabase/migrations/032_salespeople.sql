-- ============================================================
-- Vendedores e distribuição round-robin de leads
-- - Cria tabela salespeople (lista de vendedores por loja).
-- - Adiciona last_assigned_salesperson_id em stores (ponteiro do round-robin).
-- - Adiciona assigned_salesperson_id em leads (rastreabilidade).
-- - Adiciona agent_summary_fields em stores (campos do resumo de encerramento).
-- - Cria RPC pick_next_salesperson(store_id) — atômico, evita race condition.
-- - Migra notification_phone existente como "Vendedor 1".
-- ============================================================

CREATE TABLE public.salespeople (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salespeople_store_active ON public.salespeople(store_id, is_active, created_at);

CREATE TRIGGER salespeople_updated_at
  BEFORE UPDATE ON public.salespeople
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salespeople_select_staff" ON public.salespeople
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

-- ── Ponteiro do round-robin na loja ────────────────────────────────────────
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS last_assigned_salesperson_id UUID
    REFERENCES public.salespeople(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.stores.last_assigned_salesperson_id IS
  'Último vendedor que recebeu um lead — usado pelo round-robin para escolher o próximo.';

-- ── Vendedor designado para o lead ─────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_salesperson_id UUID
    REFERENCES public.salespeople(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_salesperson
  ON public.leads(assigned_salesperson_id);

COMMENT ON COLUMN public.leads.assigned_salesperson_id IS
  'Vendedor para quem este lead foi distribuído ao encerrar/transbordar a conversa.';

-- ── Campos editáveis do resumo de encerramento ─────────────────────────────
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS agent_summary_fields JSONB NOT NULL DEFAULT
    '[
      "Carro de interesse",
      "Intenção de compra (quente/morno/frio)",
      "Forma de pagamento mencionada",
      "Veículo para troca (se houver)",
      "Faixa de orçamento (se mencionada)",
      "Resumo da conversa (2 a 3 frases)"
    ]'::jsonb;

COMMENT ON COLUMN public.stores.agent_summary_fields IS
  'Array de strings — tópicos que a IA deve preencher no resumo enviado ao vendedor ao encerrar a conversa.';

-- ── RPC: escolhe o próximo vendedor de forma atômica ───────────────────────
-- Lock na linha de stores serializa duas chamadas simultâneas.
CREATE OR REPLACE FUNCTION public.pick_next_salesperson(p_store_id UUID)
RETURNS TABLE (id UUID, name TEXT, phone TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_id UUID;
  v_next_id UUID;
BEGIN
  -- Trava a linha da loja para serializar concorrência
  SELECT last_assigned_salesperson_id
    INTO v_last_id
  FROM public.stores
  WHERE public.stores.id = p_store_id
  FOR UPDATE;

  -- Pega o próximo vendedor ativo após o último (ordenado por created_at).
  -- Se não houver "próximo", volta ao primeiro (wrap-around).
  SELECT s.id INTO v_next_id
  FROM public.salespeople s
  WHERE s.store_id = p_store_id
    AND s.is_active = TRUE
    AND (
      v_last_id IS NULL
      OR s.created_at > (
        SELECT created_at FROM public.salespeople WHERE public.salespeople.id = v_last_id
      )
      OR (
        s.created_at = (SELECT created_at FROM public.salespeople WHERE public.salespeople.id = v_last_id)
        AND s.id > v_last_id
      )
    )
  ORDER BY s.created_at ASC, s.id ASC
  LIMIT 1;

  -- Se não achou (último vendedor da fila ou último foi removido), pega o primeiro
  IF v_next_id IS NULL THEN
    SELECT s.id INTO v_next_id
    FROM public.salespeople s
    WHERE s.store_id = p_store_id
      AND s.is_active = TRUE
    ORDER BY s.created_at ASC, s.id ASC
    LIMIT 1;
  END IF;

  -- Sem vendedores ativos
  IF v_next_id IS NULL THEN
    RETURN;
  END IF;

  -- Atualiza o ponteiro
  UPDATE public.stores
     SET last_assigned_salesperson_id = v_next_id
   WHERE public.stores.id = p_store_id;

  RETURN QUERY
  SELECT s.id, s.name, s.phone
    FROM public.salespeople s
   WHERE s.id = v_next_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.pick_next_salesperson(UUID) TO service_role, authenticated;

-- ── Migração: cria "Vendedor 1" a partir do notification_phone existente ───
INSERT INTO public.salespeople (store_id, name, phone, is_active)
SELECT id, 'Vendedor 1', notification_phone, TRUE
FROM public.stores
WHERE notification_phone IS NOT NULL
  AND notification_phone <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.salespeople sp WHERE sp.store_id = public.stores.id
  );
