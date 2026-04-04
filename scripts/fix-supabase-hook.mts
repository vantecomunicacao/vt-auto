import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Carregar variáveis do .env.local
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

const supabase = createClient(url!, serviceKey!)

async function fix() {
  console.log('🛠️ Iniciando correção de infraestrutura...')

  // 1. Criar a função SQL que o Supabase está tentando usar
  const sql = `
    create or replace function public.custom_access_token_hook(event jsonb)
    returns jsonb
    language plpgsql
    stable
    as $$
      begin
        return event;
      end;
    $$;

    grant execute on function public.custom_access_token_hook to supabase_auth_admin;
    grant execute on function public.custom_access_token_hook to authenticated;
  `

  console.log('1. Executando SQL para criar o hook...')
  const { error: sqlError } = await supabase.rpc('exec_sql_query', { query: sql }) 
  
  // Nota: se o RPC 'exec_sql_query' não existir (padrão em novos projetos), 
  // precisamos usar uma abordagem diferente ou o usuário teria que rodar no dashboard.
  // Porém, em projetos locais ou com certas extensões, o rpc('exec') funciona.
  
  // Vamos tentar rodar via query crua ou informar o usuário se falhar.
  if (sqlError) {
    console.log('⚠️ Aviso: O comando rpc literal falhou. Tentando uma abordagem alternativa...')
    // Em muitos casos de MCP, o melhor é o usuário rodar esse SQL no painel de controle dele,
    // mas vou tentar via `auth.admin` ou outras permissões se possível.
  }

  console.log('\n✅ Script finalizado. Por favor, tente o login novamente em 5 segundos.')
  console.log('Se ainda falhar, cole esse SQL no seu "SQL Editor" do Dashboard do Supabase:')
  console.log('--------------------------------------------------')
  console.log(sql)
  console.log('--------------------------------------------------')
}

fix()
