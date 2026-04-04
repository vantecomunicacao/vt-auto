'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const passwordReset = searchParams.get('reset') === 'success'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: storeUser } = await supabase
      .from('store_users')
      .select('store_id')
      .eq('user_id', user.id)
      .single()

    if (!storeUser) {
      router.push('/admin/dashboard')
      return
    }

    const { data: store } = await supabase
      .from('stores')
      .select('onboarding_completo')
      .eq('id', storeUser.store_id)
      .single()

    router.push(store?.onboarding_completo ? '/admin/dashboard' : '/admin/onboarding')
  }

  return (
    <div className="min-h-screen bg-ds-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4" style={{ background: 'var(--ds-primary-600)' }}>
            <span className="text-white font-semibold text-base">A</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">AutoAgente</h1>
          <p className="text-muted-foreground mt-1 text-sm">Acesse o painel da sua loja</p>
        </div>

        {passwordReset && (
          <div className="rounded-lg px-3 py-2 text-sm mb-4 text-center" style={{ background: '#F0FDF4', border: '0.5px solid #BBF7D0', color: '#16A34A' }}>
            Senha redefinida com sucesso. Faça login.
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-10 border-border rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Senha</Label>
                <a href="/admin/reset-password" className="text-xs hover:underline" style={{ color: 'var(--ds-primary-600)' }}>
                  Esqueci a senha
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 border-border rounded-lg text-sm"
              />
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#FEF2F2', border: '0.5px solid #FEE2E2', color: 'var(--ds-error)' }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-sm font-medium rounded-lg text-white"
              style={{ background: 'var(--ds-primary-600)' }}
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin mr-2" />Entrando...</>
              ) : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          AutoAgente © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
