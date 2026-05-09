-- ============================================================
-- Follow-up via pg_cron + pg_net
-- Substitui o setInterval do agente por um job agendado no Postgres,
-- que dispara um POST autenticado para /internal/cron/followup.
--
-- O secret é guardado no Supabase Vault (encriptado em repouso) — o
-- Supabase não permite ALTER DATABASE SET para GUCs custom em hosted.
--
-- PRÉ-REQUISITOS (rodar uma vez via SQL editor após esta migration):
--   SELECT vault.create_secret('<valor de CRON_SECRET>', 'cron_secret');
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ── Função que o pg_cron chama: lê o secret do vault e dispara o POST ───────
CREATE OR REPLACE FUNCTION public.trigger_followup_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret TEXT;
  v_url    TEXT := 'https://api.cargrow.com.br/internal/cron/followup';
BEGIN
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
   WHERE name = 'cron_secret'
   LIMIT 1;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE NOTICE 'cron_secret não encontrado no vault — pulando follow-up';
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
  'Disparada por pg_cron a cada 5 min. Lê cron_secret do vault e faz POST para /internal/cron/followup.';

-- ── Schedule: a cada 5 minutos ───────────────────────────────────────────────
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
