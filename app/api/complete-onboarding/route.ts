import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // 1. Validar quem está fazendo o pedido (o seu usuário logado)
    const cookieStore = cookies()
    const userClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            return (await cookieStore).getAll()
          },
          setAll(cookiesToSet) {
            // Ignorado em Server Components/API routes read-only
          },
        },
      }
    )

    const { data: { user } } = await userClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Usar o "Mestre de Chaves" (Service Role) para furar o bloqueio RLS
    // e conseguir encontrar e atualizar sua loja sem problemas de permissão
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Busca o vínculo
    const { data: storeUser, error: storeUserError } = await adminClient
      .from('store_users')
      .select('store_id')
      .eq('user_id', user.id)
      .single()

    if (storeUserError || !storeUser) {
      console.error('[API Onboarding] Erro ao buscar store_id:', storeUserError)
      return NextResponse.json({ error: 'Loja não encontrada para este usuário.' }, { status: 400 })
    }

    // Atualiza a loja
    const { error: updateError } = await adminClient
      .from('stores')
      .update({
        name: data.name,
        phone: data.phone,
        city: data.city,
        state: data.state,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        layout: data.layout,
        slug: data.slug,
        onboarding_completo: true,
        onboarding_step: 6,
      })
      .eq('id', storeUser.store_id)

    if (updateError) {
      console.error('[API Onboarding] Erro ao atualizar stores:', JSON.stringify(updateError, null, 2))
      return NextResponse.json({ error: updateError.message || JSON.stringify(updateError) }, { status: 500 })
    }

    // Sucesso absoluto
    return NextResponse.json({ success: true, store_id: storeUser.store_id })

  } catch (err: any) {
    console.error('[API Onboarding] Falha crítica:', err)
    return NextResponse.json({ error: 'Erro interno no servidor de salvamento' }, { status: 500 })
  }
}
