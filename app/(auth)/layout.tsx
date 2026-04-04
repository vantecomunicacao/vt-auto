import Image from 'next/image'
import Link from 'next/link'
import { Car } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado Esquerdo: Informativo/Marketing */}
      <div className="hidden lg:flex flex-col justify-between bg-ds-sidebar p-12 text-white relative overflow-hidden">
        {/* Gradiente decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-ds-primary-600/20 blur-[120px] -mr-48 -mt-48 rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-ds-primary-700/10 blur-[100px] -ml-48 -mb-48 rounded-full" />

        <Link href="/" className="flex items-center gap-2 relative z-10 transition-transform active:scale-95">
          <div className="w-10 h-10 bg-ds-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-ds-primary-600/20">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">AutoAgente</span>
        </Link>

        <div className="space-y-6 relative z-10">
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">
            Acelerando sua revenda com <span className="text-ds-primary-600 italic">Inteligência</span>.
          </h1>
          <p className="text-xl text-slate-400 max-w-md leading-relaxed">
            Gestão de estoque, CRM inteligente e atendentes de IA no WhatsApp. 
            Tudo o que sua loja precisa em um único lugar.
          </p>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-8 flex items-center gap-6">
          <div className="flex -space-x-3">
             {/* Avatares fake para social proof */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-ds-sidebar bg-slate-800 flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`}
                  alt="user"
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-400">
            Utilizado por mais de <span className="text-white font-semibold">150 lojas</span> em todo o Brasil.
          </p>
        </div>
      </div>

      {/* Lado Direito: Formulários */}
      <div className="flex items-center justify-center p-8 bg-background relative">
        {/* Logo para mobile */}
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Car className="w-6 h-6 text-ds-primary-600" />
            <span className="text-xl font-bold tracking-tight text-foreground">AutoAgente</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          {children}
        </div>
      </div>
    </div>
  )
}
