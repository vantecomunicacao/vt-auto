-- ============================================================
-- WhatsApp Labels (etiquetas)
-- Sincroniza as etiquetas que o usuário cria no app do WhatsApp Business
-- e permite escolher uma para desligar o bot por lead, e outra para o
-- bot aplicar quando transferir o atendimento ao humano.
-- ============================================================

CREATE TABLE public.whatsapp_labels (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id             UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  evolution_label_id   TEXT NOT NULL,
  name                 TEXT NOT NULL,
  color                INT,
  synced_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, evolution_label_id)
);

CREATE INDEX idx_whatsapp_labels_store_id ON public.whatsapp_labels(store_id);

CREATE TRIGGER whatsapp_labels_updated_at
  BEFORE UPDATE ON public.whatsapp_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.whatsapp_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_labels_select_staff" ON public.whatsapp_labels
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

-- ── Configuração por loja ────────────────────────────────────────────────────
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS bot_disable_label_id TEXT,
  ADD COLUMN IF NOT EXISTS bot_handoff_label_id TEXT;

COMMENT ON COLUMN public.stores.bot_disable_label_id IS
  'evolution_label_id da etiqueta que, quando aplicada a um chat no WhatsApp, desliga o bot para aquele lead';
COMMENT ON COLUMN public.stores.bot_handoff_label_id IS
  'evolution_label_id da etiqueta que o bot aplica automaticamente ao transferir o atendimento para um humano';

-- ── Amplia motivos de pausa do agente ────────────────────────────────────────
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_ai_paused_reason_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_ai_paused_reason_check
    CHECK (ai_paused_reason IN ('transbordo', 'encerramento', 'manual', 'whatsapp_label'));
