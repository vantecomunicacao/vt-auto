-- Rastreia quais veículos já tiveram a ficha completa apresentada ao lead,
-- para o agente não repetir marca/modelo/ano/cor/km/opcionais/preço a cada turno.
-- Chave: "marca-modelo" normalizado (lowercase, sem espaços). Valor: timestamp ISO da 1ª apresentação.
-- Resetado por inatividade (ver agent.ts) quando o lead volta após longo intervalo.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS presented_vehicles JSONB NOT NULL DEFAULT '{}'::jsonb;
