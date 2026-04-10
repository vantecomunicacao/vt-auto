-- Adiciona constraint única para evitar leads duplicados por telefone na mesma loja
-- Necessário para upsert atômico no agente (evita race condition em webhooks simultâneos)
ALTER TABLE public.leads
  ADD CONSTRAINT leads_store_phone_unique UNIQUE (store_id, phone);
