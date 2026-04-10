-- ============================================================
-- Janela de contexto e delay de debounce do agente IA
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS agent_context_window  INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS agent_debounce_seconds INTEGER NOT NULL DEFAULT 3;
