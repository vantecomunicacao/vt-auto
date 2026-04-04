-- ============================================================
-- TABELA: store_users
-- Vínculo entre auth.users e lojas (owner | seller)
-- ============================================================

CREATE TABLE public.store_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('owner', 'seller')),
  is_active  BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (store_id, user_id)
);

-- Índices
CREATE INDEX idx_store_users_store_id ON public.store_users(store_id);
CREATE INDEX idx_store_users_user_id ON public.store_users(user_id);

-- Trigger updated_at
CREATE TRIGGER store_users_updated_at
  BEFORE UPDATE ON public.store_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_users_select_own" ON public.store_users
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
  );

CREATE POLICY "store_users_insert_owner" ON public.store_users
  FOR INSERT WITH CHECK (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'owner'
  );

CREATE POLICY "store_users_update_owner" ON public.store_users
  FOR UPDATE USING (
    store_id = (auth.jwt() ->> 'store_id')::UUID
    AND (auth.jwt() ->> 'role') = 'owner'
  );

COMMENT ON TABLE public.store_users IS 'Usuários vinculados a cada loja com seus papéis';
