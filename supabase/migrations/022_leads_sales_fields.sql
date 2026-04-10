-- Novos campos de qualificação
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS budget TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS trade_in TEXT;

-- Novos status de funil de vendas
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check CHECK (
    status IN ('new', 'qualifying', 'negotiating', 'closing', 'converted', 'lost',
               'in_progress', 'qualified')  -- mantidos para compatibilidade
  );
