import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const value = parts.slice(1).join('=').trim()
    env[key] = value
  }
})

const url = env['NEXT_PUBLIC_SUPABASE_URL']
const serviceKey = env['SUPABASE_SERVICE_KEY']

async function fixRLS() {
  console.log('--- OPERAÇÃO RESGATE: CORREÇÃO DE SEGURANÇA (RLS) ---')
  // 1. Corrigindo política de SELEÇÃO da tabela store_users
  console.log('1. Atualizando política de store_users...')
  const fixStoreUsersSQL = `
    DROP POLICY IF EXISTS "store_users_select_own" ON public.store_users;
    CREATE POLICY "store_users_select_own" ON public.store_users
      FOR SELECT USING (
        user_id = auth.uid() OR store_id = (auth.jwt() ->> 'store_id')::UUID
      );
  `
  // Supabase JS doesn't have an endpoint for raw SQL by default except via RPC or the Dashboard.
  // We can use a Postgres function if it exists, but the easiest way is to let the developer run it in the SQL Editor.
  console.error("Please run the SQL manually in Supabase SQL Editor:\n" + fixStoreUsersSQL);
}

fixRLS()
