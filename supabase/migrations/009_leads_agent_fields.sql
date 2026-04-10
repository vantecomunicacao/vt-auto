-- ============================================================
-- Campos do agente IA na tabela leads
-- ============================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ai_active           BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_user_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follow_up_total     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_follow_up_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_ai_active ON public.leads(store_id, ai_active);
CREATE INDEX IF NOT EXISTS idx_leads_followup  ON public.leads(store_id, ai_active, follow_up_total, last_user_message_at);
