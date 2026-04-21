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
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

const email = 'mktvantecomunicacao@gmail.com'
const password = '123456'

async function runTest() {
  const adminClient = createClient(url!, serviceKey!)
  const authClient = createClient(url!, anonKey!)

  console.log('--- TESTE DE SANIDADE SUPABASE ---')

  // 1. Reset Total
  console.log('1. Removendo usuário antigo...')
  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const existing = users.find(u => u.email === email)
  if (existing) await adminClient.auth.admin.deleteUser(existing.id)

  // 2. Criação Limpa
  console.log('2. Criando usuário novo (senha: 123456)...')
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (createError) {
    console.error('❌ Erro na criação:', createError.message)
    return
  }
  console.log('✅ Usuário criado com ID:', newUser.user?.id)

  // 3. Vincular Loja
  console.log('3. Vinculando loja...')
  const { data: store, error: storeError } = await adminClient
    .from('stores')
    .upsert({ name: 'Minha Loja', slug: 'minha-loja', onboarding_completo: true }, { onConflict: 'slug' })
    .select()
    .single()

  if (storeError) {
    console.error('❌ Erro na Loja:', storeError.message)
    return
  }

  const { error: linkError } = await adminClient
    .from('store_users')
    .upsert({ store_id: store!.id, user_id: newUser.user!.id, role: 'owner' }, { onConflict: 'store_id,user_id' })

  if (linkError) {
    console.error('❌ Erro no vínculo:', linkError.message)
    return
  }

  // 4. TESTE DE LOGIN (O momento da verdade)
  console.log('\n4. 🚨 TENTANDO LOGIN VIA SCRIPT (usando a chave Anon)...')
  try {
    const { data: loginData, error: loginError } = await authClient.auth.signInWithPassword({
      email,
      password
    })

    if (loginError) {
      console.log('❌ O LOGIN FALHOU NO SCRIPT TAMBÉM!')
      console.log('Erro retornado pelo Supabase Auth:', loginError.message)
      console.log('Status HTTP:', loginError.status)
    } else {
      console.log('✅ O LOGIN FUNCIONOU NO SCRIPT!')
      console.log('Token (final):', loginData.session?.access_token.substring(0, 15) + '...')
    }
  } catch (e: unknown) {
    console.error('❌ Crash inesperado no login:', (e as Error).message)
  }
}

runTest()
