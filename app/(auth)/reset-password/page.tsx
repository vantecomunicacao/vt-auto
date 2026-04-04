'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/schemas/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/update`,
      })

      if (error) throw error

      setSubmitted(true)
      toast.success('Link de recuperação enviado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar e-mail. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-none shadow-none bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="p-0 mb-8 text-center">
          <div className="w-16 h-16 bg-ds-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-ds-success" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900 line-clamp-2">Verifique seu e-mail</CardTitle>
          <CardDescription className="text-lg mt-4 font-medium text-slate-500 leading-relaxed">
            Enviamos um link de recuperação para o endereço informado. 
            Verifique também sua caixa de spam.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Link
            href="/login"
            className="flex items-center justify-center w-full h-12 bg-ds-primary-600 hover:bg-ds-primary-700 text-white font-bold text-base transition-all active:scale-[0.98] rounded-md"
          >
            Voltar ao Login
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="p-0 mb-8">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold text-ds-primary-600 hover:text-ds-primary-700 transition-all mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar ao login
        </Link>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Recuperar senha</CardTitle>
        <CardDescription className="text-lg mt-2 font-medium text-slate-500">
          Insira seu e-mail abaixo e enviaremos um link para você redefinir sua senha.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">E-mail de cadastro</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-ds-primary-600 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@loja.com.br"
                disabled={loading}
                className="pl-10 h-12 border-slate-200 focus-visible:ring-ds-primary-600/20 focus-visible:border-ds-primary-600 transition-all font-medium"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-semibold text-ds-error animate-in fade-in slide-in-from-left-1">{errors.email.message}</p>
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
                Enviando e-mail...
              </>
            ) : (
              'Enviar Link de Recuperação'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="p-0 mt-8">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 w-full text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Se você não receber o e-mail em alguns minutos, tente novamente ou fale com o suporte.
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
