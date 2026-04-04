'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Mail, Lock } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.status === 400) {
          throw new Error('E-mail ou senha incorretos. Verifique suas credenciais.')
        }
        throw error
      }

      toast.success('Login realizado com sucesso! Redirecionando...')
      
      // O middleware cuidará do redirecionamento para o subdomínio correto
      // Forçamos um refresh para garantir que a sessão seja lida pelo middleware em todas as abas
      router.refresh()
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="p-0 mb-8">
        <CardTitle className="text-3xl font-extrabold tracking-tight">Acesse sua conta</CardTitle>
        <CardDescription className="text-lg mt-2 font-medium text-slate-500">
          Bem-vindo de volta ao sistema de gestão do <span className="text-ds-primary-600">AutoAgente</span>.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">E-mail</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-ds-primary-600 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="nome@loja.com.br"
                disabled={loading}
                className="pl-10 h-12 border-slate-200 focus-visible:ring-ds-primary-600/20 focus-visible:border-ds-primary-600 transition-all font-medium"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-semibold text-ds-error animate-in fade-in slide-in-from-left-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Senha</Label>
              <Link 
                href="/reset-password" 
                className="text-xs font-bold text-ds-primary-600 hover:text-ds-primary-700 transition-colors"
                tabIndex={-1}
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-ds-primary-600 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={loading}
                className="pl-10 h-12 border-slate-200 focus-visible:ring-ds-primary-600/20 focus-visible:border-ds-primary-600 transition-all font-medium"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-xs font-semibold text-ds-error animate-in fade-in slide-in-from-left-1">{errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-ds-primary-600 hover:bg-ds-primary-700 text-white font-bold text-base shadow-lg shadow-ds-primary-600/20 transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Validando...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="p-0 mt-8 block">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Não tem uma conta? Fale com o seu gerente <span className="font-bold text-slate-700">AutoAgente</span> para receber seu convite por e-mail.
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
