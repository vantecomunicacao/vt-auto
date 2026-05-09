-- ============================================================
-- Follow-up via pg_cron + pg_net
-- Substitui o setInterval do agente por um job agendado no Postgres,
-- que dispara um POST autenticado para /internal/cron/followup.
--
-- PRÉ-REQUISITOS (Supabase dashboard ou SQL editor):
--   1) Aplicar este arquivo
--   2) Definir o secret no banco (uma vez, fora do git):
--        ALTER DATABASE postgres SET app.cron_secret = '<mesmo valor de CRON_SECRET no agente>';
--   3) Reabrir a sessão SQL para o GUC ser visível pelo pg_cron
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Função que o pg_cron chama: lê o secret e dispara o POST ─────────────────
CREATE OR REPLACE FUNCTION public.trigger_followup_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret TEXT;
  v_url    TEXT := 'https://api.cargrow.com.br/internal/cron/followup';
BEGIN
  v_secret := current_setting('app.cron_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE NOTICE 'app.cron_secret não configurado — pulando follow-up';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-Cron-Secret', v_secret),
    body    := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_followup_cron() IS
  'Disparada por pg_cron a cada 5 min. Faz POST para /internal/cron/followup do agente.';

-- ── Schedule: a cada 5 minutos ───────────────────────────────────────────────
-- unschedule antes de schedular para idempotência (re-aplicação da migration)
DO $$
BEGIN
  PERFORM cron.unschedule('followup-every-5min');
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'followup-every-5min',
  '*/5 * * * *',
  $$SELECT public.trigger_followup_cron()$$
);
