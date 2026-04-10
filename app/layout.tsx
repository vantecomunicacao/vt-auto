import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ProgressBar } from '@/components/ProgressBar'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AutoAgente',
  description: 'Plataforma SaaS para lojas de veículos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <ProgressBar />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
