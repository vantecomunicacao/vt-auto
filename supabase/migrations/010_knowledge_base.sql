-- ============================================================
-- Base de conhecimento com suporte a RAG (pgvector)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_store_id ON public.knowledge_base(store_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON public.knowledge_base
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_select_owner" ON public.knowledge_base
  FOR SELECT USING (store_id = (auth.jwt() ->> 'store_id')::UUID);

CREATE POLICY "knowledge_insert_owner" ON public.knowledge_base
  FOR INSERT WITH CHECK (store_id = (auth.jwt() ->> 'store_id')::UUID AND (auth.jwt() ->> 'role') = 'owner');

CREATE POLICY "knowledge_delete_owner" ON public.knowledge_base
  FOR DELETE USING (store_id = (auth.jwt() ->> 'store_id')::UUID AND (auth.jwt() ->> 'role') = 'owner');

CREATE POLICY "knowledge_service" ON public.knowledge_base
  FOR ALL USING (auth.role() = 'service_role');

-- Função de busca vetorial
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count     int,
  p_store_id      uuid
)
RETURNS TABLE (id uuid, content text, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT kb.id, kb.content,
         1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE kb.store_id = p_store_id
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
