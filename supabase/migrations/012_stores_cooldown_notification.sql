-- ============================================================
-- Cooldown após mensagem humana + número de notificação
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS agent_cooldown_minutes  INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS notification_phone      TEXT;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_human_message_at  TIMESTAMPTZ;
