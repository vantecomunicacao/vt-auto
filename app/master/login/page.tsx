'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function MasterLoginPage() {
  const router = useRouter()
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

    if (!user || user.user_metadata?.is_master !== true) {
      await supabase.auth.signOut()
      setError('Acesso não autorizado.')
      setLoading(false)
      return
    }

    router.push('/master/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-700 mb-4">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Master Admin</h1>
          <p className="text-slate-400 mt-1 text-sm">Acesso restrito ao superadmin</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="master@autoagente.com"
                className="w-full h-10 px-3 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-sm bg-red-900/40 border border-red-700/50 text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-sm font-medium rounded-lg text-white bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin mr-2" />Entrando...</>
              ) : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          AutoAgente Master © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
