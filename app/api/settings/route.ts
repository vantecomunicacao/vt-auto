import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { encrypt, safeDecrypt } from '@/lib/crypto'

async function getStoreId(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', userId)
    .single()
  return data?.store_id ?? null
}

// GET /api/settings — retorna dados da loja
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const storeId = await getStoreId(user.id)
  if (!storeId) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const admin = createAdminClient()
  const { data: store, error } = await admin
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single()

  if (error || !store) return NextResponse.json({ error: 'Erro ao buscar loja' }, { status: 500 })

  // Descriptografa a chave OpenAI antes de retornar ao frontend
  if (store.openai_api_key) {
    store.openai_api_key = safeDecrypt(store.openai_api_key)
  }

  return NextResponse.json({ store, storeId })
}

// PATCH /api/settings — atualiza dados da loja
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const storeId = await getStoreId(user.id)
  if (!storeId) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const body = await request.json()

  // Whitelist de campos permitidos — impede alteração de plan, is_active, etc.
  const allowed = [
    // Dados da loja
    'name', 'phone', 'landline', 'city', 'state', 'email', 'primary_color', 'secondary_color', 'logo_url', 'favicon_url', 'slug', 'custom_domain',
    'description', 'address',
    // Agente IA — personalidade e comportamento
    'agent_active', 'agent_name', 'agent_tone', 'agent_prompt', 'openai_api_key', 'openai_model',
    'agent_context_window', 'agent_debounce_seconds', 'agent_cooldown_minutes', 'notification_phone',
    'agent_max_message_chars', 'agent_typing_speed_ms', 'agent_image_prompt', 'agent_end_prompt', 'agent_stop_on_end', 'agent_rate_limit',
    // Agente IA — follow-up e horários
    'follow_up_enabled', 'follow_up_config', 'agent_hours',
  ] as const
  type AllowedKey = typeof allowed[number]
  const safeBody = Object.fromEntries(
    Object.entries(body).filter(([key]) => (allowed as readonly string[]).includes(key))
  ) as Partial<Record<AllowedKey, unknown>>

  // Criptografa a chave OpenAI antes de persistir
  if (safeBody.openai_api_key && typeof safeBody.openai_api_key === 'string') {
    safeBody.openai_api_key = encrypt(safeBody.openai_api_key)
  }

  if (Object.keys(safeBody).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('stores')
    .update(safeBody)
    .eq('id', storeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
