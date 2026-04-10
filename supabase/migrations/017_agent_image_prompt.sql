ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS agent_image_prompt TEXT NOT NULL DEFAULT 'O cliente enviou uma imagem. Descreva o que vê e responda de forma útil no contexto de venda de veículos.';
