import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Carregar variáveis do .env.local manualmente
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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = env['SUPABASE_SERVICE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const email = 'mktvantecomunicacao@gmail.com'
const password = '123456'

async function debug() {
  console.log(`\n🔍 Verificando usuário: ${email}...`)

  // 1. Listar usuários
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError.message)
    return
  }

  const user = users?.find(u => u.email === email)

  if (user) {
    console.log(`✅ Usuário encontrado! ID: ${user.id}`)
    console.log(`📧 E-mail confirmado: ${user.email_confirmed_at ? 'SIM' : 'NÃO'}`)
    
    // Forçar deleção e recriação para garantir a senha
    console.log('♻️ Deletando usuário para recriar do zero...')
    await supabase.auth.admin.deleteUser(user.id)
  } else {
    console.log('ℹ️ Usuário não encontrado no banco.')
  }

  // 2. Criar usuário limpo
  console.log('🆕 Criando usuário novo com a senha 123456...')
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (createError) {
    console.error('❌ Erro ao criar usuário:', createError.message)
    return
  }

  const userId = newUser.user!.id
  console.log(`✅ Usuário criado no Auth! New ID: ${userId}`)

  // 3. Garantir Loja e Vínculo
  console.log('🏪 Garantindo loja "Minha Loja"...')
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .upsert({ name: 'Minha Loja', slug: 'minha-loja', onboarding_completo: true }, { onConflict: 'slug' })
    .select()
    .single()

  if (storeError) {
    console.error('❌ Erro na Loja:', storeError.message)
  } else {
    console.log(`✅ Loja OK: ${store.id}`)
    
    console.log('🔗 Vinculando usuário à loja...')
    const { error: linkError } = await supabase
      .from('store_users')
      .upsert({ store_id: store.id, user_id: userId, role: 'owner' }, { onConflict: 'store_id,user_id' })
    
    if (linkError) {
      console.error('❌ Erro no vínculo:', linkError.message)
    } else {
      console.log('✅ Vínculo OK!')
    }
  }

  console.log('\n🚀 TUDO PRONTO! Tente logar novamente com:')
  console.log(`E-mail: ${email}`)
  console.log(`Senha: ${password}`)
}

debug().catch(console.error)
