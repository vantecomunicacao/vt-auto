import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Carregar variáveis do .env.local manualmente
const envFile = fs.readFileSync('.env.local', 'utf-8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = env['SUPABASE_SERVICE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const email = 'mktvantecomunicacao@gmail.com'
const password = '123456'

async function setup() {
  console.log(`\n🚀 Criando usuário administrador: ${email}...`)

  // 1. Verificar se o usuário já existe no Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  const existingUser = users?.find(u => u.email === email)

  let userId: string

  if (existingUser) {
    console.log('⚠️ Usuário já existe. Resetando senha e confirmando e-mail...')
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password, email_confirm: true }
    )
    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError.message)
      return
    }
    userId = existingUser.id
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (createError) {
      console.error('Erro ao criar usuário:', createError.message)
      return
    }
    userId = newUser.user!.id
    console.log('✅ Usuário criado com sucesso no Auth.')
  }

  // 2. Criar uma Loja padrão se não existir
  console.log('🏪 Criando loja padrâo...')
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .upsert({ 
      name: 'Minha Loja', 
      slug: 'minha-loja',
      onboarding_completo: true 
    }, { onConflict: 'slug' })
    .select()
    .single()

  if (storeError) {
    console.error('Erro ao criar loja:', storeError.message)
    return
  }
  console.log(`✅ Loja vinculada: ${store.name} (ID: ${store.id})`)

  // 3. Vincular usuário à loja como Owner
  console.log('🔗 Vinculando usuário como Owner...')
  const { error: linkError } = await supabase
    .from('store_users')
    .upsert({
      store_id: store.id,
      user_id: userId,
      role: 'owner',
      is_active: true
    }, { onConflict: 'store_id,user_id' })

  if (linkError) {
    console.error('Erro ao vincular usuário:', linkError.message)
    return
  }

  console.log('\n✨ Script finalizado com sucesso!')
  console.log('--------------------------------------------------')
  console.log(`Login: ${email}`)
  console.log(`Senha: ${password}`)
  console.log('--------------------------------------------------')
  console.log('Agora você já pode fazer login na plataforma.')
}

setup().catch(console.error)
