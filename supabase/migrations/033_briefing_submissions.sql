-- ============================================================
-- Submissões do briefing público (lead magnet em /briefing)
-- - Tabela briefing_submissions: armazena cada envio do formulário público.
-- - Payload completo em JSONB (data) para flexibilidade futura do briefing.
-- - Colunas extraídas e indexadas para listagem/busca rápida no admin.
-- - INSERT permitido para anon/authenticated (serve role no servidor).
-- - SELECT/UPDATE/DELETE apenas para usuários master (suporte/equipe interna).
-- ============================================================

CREATE TABLE public.briefing_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação (extraído do payload para indexar)
  store_name        TEXT NOT NULL,
  responsible_name  TEXT NOT NULL,
  cnpj              TEXT,
  email             TEXT,
  whatsapp          TEXT,

  -- Payload completo (todo o briefing, inclusive seções opcionais)
  data              JSONB NOT NULL,

  -- Auditoria / anti-abuso
  ip_address        TEXT,
  user_agent        TEXT,

  -- Workflow interno (suporte/comercial)
  status            TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'contacted', 'converted', 'spam')),
  notes             TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_briefing_created_at ON public.briefing_submissions(created_at DESC);
CREATE INDEX idx_briefing_status     ON public.briefing_submissions(status);
CREATE INDEX idx_briefing_cnpj_email ON public.briefing_submissions(cnpj, email, created_at DESC);

CREATE TRIGGER briefing_submissions_updated_at
  BEFORE UPDATE ON public.briefing_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.briefing_submissions ENABLE ROW LEVEL SECURITY;

-- INSERT público: o servidor usa service_role (bypass RLS), mas garantimos que
-- nenhum cliente direto consiga ler/alterar mesmo se tentar via API REST.
-- Não criamos policy de INSERT para anon/authenticated — apenas service_role insere.

-- SELECT/UPDATE/DELETE: somente master (equipe interna)
CREATE POLICY "briefing_select_master" ON public.briefing_submissions
  FOR SELECT USING ((auth.jwt() ->> 'is_master')::BOOLEAN = true);

CREATE POLICY "briefing_update_master" ON public.briefing_submissions
  FOR UPDATE USING ((auth.jwt() ->> 'is_master')::BOOLEAN = true);

CREATE POLICY "briefing_delete_master" ON public.briefing_submissions
  FOR DELETE USING ((auth.jwt() ->> 'is_master')::BOOLEAN = true);

COMMENT ON TABLE public.briefing_submissions IS
  'Submissões do briefing público em /briefing — usado para captura de leads e configuração assistida de novas lojas.';
