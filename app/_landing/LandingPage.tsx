'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Brain,
  Building2,
  Check,
  ChevronDown,
  Menu,
  MapPin,
  Mic,
  Phone,
  Plug,
  Receipt,
  RefreshCw,
  Shield,
  Sparkles,
  Store,
  Zap,
  X,
} from 'lucide-react'

/* Brand icons (inline) — lucide-react v1.7 doesn't ship them */
function WhatsappIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}
const WHATSAPP_NUMBER = '5511969382469'
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Olá! Tenho interesse no CarGrow.'
)}`

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.cargrow.com.br'
const LOGIN_URL = `${APP_URL}/login`

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      <Header />
      <main>
        <Hero />
        <FeatureCategories />
        <FeatureHighlights />
        <DarkStrip />
        <PromoBanner />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

/* ─────────────────────────── HEADER ─────────────────────────── */

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const nav = [
    { href: '#recursos', label: 'Recursos' },
    { href: '#destaques', label: 'Destaques' },
    { href: '#planos', label: 'Planos' },
    { href: '#faq', label: 'FAQ' },
  ]

  return (
    <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2">
      <div
        className={`flex items-center gap-3 rounded-full border px-3 py-2 transition-all duration-300 ${
          scrolled
            ? 'border-slate-200 bg-white/85 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl'
            : 'border-white/40 bg-white/60 backdrop-blur-md'
        }`}
      >
        <Link href="/" className="flex items-center gap-2 pl-2 pr-3">
          <Logo />
        </Link>

        <nav className="hidden flex-1 justify-center gap-1 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={LOGIN_URL}
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-flex"
          >
            Login
          </Link>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener"
            className="hidden items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-px hover:bg-slate-800 sm:inline-flex"
          >
            <WhatsappIcon className="size-4" />
            Falar agora
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-full bg-slate-900 text-white md:hidden"
            aria-label="Abrir menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl md:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 px-1 pb-1">
            <Link
              href={LOGIN_URL}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Login
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener"
              className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Falar agora
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

function Logo({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <Image
      src={light ? '/brand/cargrow-logo-light.png' : '/brand/cargrow-logo-dark.png'}
      alt="CarGrow"
      width={1000}
      height={200}
      priority
      className={`h-7 w-auto ${className}`}
    />
  )
}

/* ─────────────────────────── HERO ─────────────────────────── */

function Hero() {
  const [tab, setTab] = useState<'vitrine' | 'agente' | 'crm'>('agente')

  const tabs = [
    { id: 'vitrine' as const, label: 'Vitrine' },
    { id: 'agente' as const, label: 'Agente IA' },
    { id: 'crm' as const, label: 'CRM' },
  ]

  const tabContent = {
    vitrine: {
      headline: 'Sua loja online, sob seu domínio',
      bullets: ['Logo, banner e cores', 'Estoque ilimitado', 'WhatsApp em cada anúncio'],
    },
    agente: {
      headline: 'IA atende em 12 segundos, 24/7',
      bullets: ['Áudio, texto e imagem', 'Conhece todo seu estoque', 'Follow-up automático'],
    },
    crm: {
      headline: 'Lead nenhum cai no esquecimento',
      bullets: ['Permissão por papel', 'Histórico completo', 'Origem de cada lead'],
    },
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 pb-24 pt-32 text-white sm:pt-40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.18),transparent_55%)]" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Sua concessionária <br />
              vendendo no WhatsApp <br />
              <span className="text-white/40">enquanto você dorme.</span>
            </h1>
          </div>

          <div className="text-base text-white/70 lg:col-span-4">
            <p>
              Vitrine personalizada, agente de IA no WhatsApp e CRM com permissões — num lugar
              só. Capte, qualifique e feche, sem perder cliente por demora.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Quero testar grátis
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#destaques"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                Ver demonstração
              </a>
            </div>
          </div>
        </div>

        {/* Floating tab card */}
        <div className="relative mt-16">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/30 p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    tab === t.id
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 px-3 py-6 md:grid-cols-[1fr_auto] md:items-center md:px-6">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-white/50">
                  {tabs.find((t) => t.id === tab)?.label}
                </div>
                <div className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {tabContent[tab].headline}
                </div>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
                  {tabContent[tab].bullets.map((b) => (
                    <li key={b} className="inline-flex items-center gap-2">
                      <Check className="size-4 text-blue-400" strokeWidth={2.6} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-blue-500 md:py-5"
              >
                Solicitar acesso
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── FEATURE CATEGORIES ─────────────────────────── */

function FeatureCategories() {
  return (
    <section id="recursos" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Tudo que sua loja <br /> precisa, num lugar só.
            </h2>
          </div>
          <p className="max-w-md text-base text-slate-500">
            Quatro pilares que substituem planilha, ChatGPT improvisado, plataforma de site e
            grupo de WhatsApp do time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <CategoryCard
            tag="01"
            title="Vitrine"
            desc="Sua loja online, sob seu domínio. Logo, banner, paleta — tudo com a sua cara."
            icon={Store}
          />
          <CategoryCard
            tag="02"
            title="Agente IA"
            desc="Atende em segundos no WhatsApp. Áudio, imagem e texto — 24 horas por dia."
            icon={Bot}
          />
          <CategoryCard
            tag="03"
            title="Integrações"
            desc="WhatsApp Business, OLX, Webmotors e mais. Tudo cai num lugar só."
            icon={Plug}
          />
          <CategoryCard
            tag="04"
            title="Multi-loja"
            desc="Toda a rede num painel só. Estoque, leads e times centralizados."
            icon={Building2}
          />
        </div>
      </div>
    </section>
  )
}

function CategoryCard({
  title,
  desc,
  tag,
  icon: Icon,
}: {
  title: string
  desc: string
  tag: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}) {
  return (
    <div className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-7 transition-colors hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
          {tag}
        </span>
      </div>
      <h3 className="mt-7 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
  )
}

/* ─────────────────────────── HIGHLIGHTS (TREND VEHICLES style) ─────────────────────────── */

function FeatureHighlights() {
  const items = [
    {
      title: 'Resposta em 12s',
      tag: 'Tempo médio',
      desc: 'A IA responde em segundos, dia ou madrugada. Cliente nunca espera.',
      icon: Zap,
      featured: true,
    },
    {
      title: 'Conhece seu estoque',
      tag: 'RAG por loja',
      desc: 'Carros, condições, horários — a IA sabe tudo o que você cadastrou.',
      icon: Brain,
    },
    {
      title: 'Áudio + imagem',
      tag: 'Multimodal',
      desc: 'Cliente manda áudio ou foto? A IA entende e responde com contexto.',
      icon: Mic,
    },
    {
      title: 'Follow-up sozinho',
      tag: 'Sempre ativo',
      desc: 'Lead esfriou? A IA volta no momento certo, sem ser invasiva.',
      icon: RefreshCw,
    },
  ]

  return (
    <section id="destaques" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Recursos em destaque
          </h2>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Ver tudo
            <ArrowRight className="size-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`group relative flex flex-col rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
                  item.featured
                    ? 'bg-blue-100/70 ring-1 ring-blue-200'
                    : 'bg-white ring-1 ring-slate-200'
                }`}
              >
                <div
                  className={`mb-8 inline-flex size-11 items-center justify-center rounded-2xl ${
                    item.featured ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  <Icon className="size-5" strokeWidth={2.4} />
                </div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                  {item.tag}
                </div>
                <div className="text-xl font-bold text-slate-900">{item.title}</div>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                <div className="mt-6 flex items-center justify-between">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener"
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      item.featured
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Saiba mais
                    <ArrowUpRight className="size-3.5" strokeWidth={2.6} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── DARK STRIP ─────────────────────────── */

function DarkStrip() {
  const items = [
    { icon: Phone, title: 'Onboarding', desc: 'guiado em\n10 minutos' },
    { icon: Sparkles, title: 'Tom da loja', desc: 'IA fala\ncomo você fala' },
    { icon: Shield, title: 'Dados isolados', desc: 'segurança a\nnível de banco' },
    { icon: Receipt, title: 'Sem amarração', desc: 'cancele\nquando quiser' },
  ]

  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/10 px-6 py-12 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="flex items-center gap-4 px-4 first:pl-0 last:pr-0">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Icon className="size-5 text-blue-300" strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{item.title}</div>
                <div className="whitespace-pre-line text-xs text-white/60">{item.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ─────────────────────────── PROMO BANNER ─────────────────────────── */

function PromoBanner() {
  return (
    <section className="bg-slate-950 pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black p-10 sm:p-14">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:32px_32px]"
          />
          <div
            aria-hidden
            className="absolute -right-32 -top-32 size-96 rounded-full bg-blue-600/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 size-72 rounded-full bg-indigo-600/20 blur-3xl"
          />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h3 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Comece grátis. <br />
                <span className="text-white/50">Decida em 14 dias.</span>
              </h3>
              <p className="mt-5 max-w-md text-base text-white/70">
                Sem cartão de crédito. Sem letrinha miúda. Cancele com 1 clique se não for pra
                você — e leve seu backup completo.
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Quero testar agora
                <ArrowRight className="size-4" />
              </a>
            </div>

            <div className="flex aspect-square size-48 flex-col items-center justify-center rounded-3xl bg-blue-500 p-6 text-center shadow-2xl shadow-blue-600/40 sm:size-60">
              <div className="text-6xl font-extrabold leading-none text-white sm:text-7xl">14</div>
              <div className="mt-2 text-sm font-semibold text-white">dias grátis</div>
              <div className="mt-1 text-xs text-white/80">acesso completo</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── PLANS ─────────────────────────── */

function Plans() {
  type Feature = { label: string; value?: string; included: boolean }

  const plans: {
    name: string
    desc: string
    highlighted?: boolean
    features: Feature[]
  }[] = [
    {
      name: 'Starter',
      desc: 'Loja começando',
      features: [
        { label: 'Veículos no estoque', value: 'até 30', included: true },
        { label: 'Vendedor', value: '1', included: true },
        { label: 'Vitrine personalizada', included: true },
        { label: 'Suporte por e-mail', included: true },
        { label: 'Agente IA no WhatsApp', included: false },
        { label: 'Domínio próprio', included: false },
        { label: 'Multi-loja', included: false },
      ],
    },
    {
      name: 'Pro',
      desc: 'Concessionária ativa',
      highlighted: true,
      features: [
        { label: 'Veículos no estoque', value: 'ilimitado', included: true },
        { label: 'Vendedores', value: 'até 10', included: true },
        { label: 'Vitrine personalizada', included: true },
        { label: 'Agente IA no WhatsApp', included: true },
        { label: 'Domínio próprio', included: true },
        { label: 'Suporte prioritário', included: true },
        { label: 'Multi-loja', included: false },
      ],
    },
    {
      name: 'Network',
      desc: 'Rede de lojas',
      features: [
        { label: 'Veículos no estoque', value: 'ilimitado', included: true },
        { label: 'Vendedores', value: 'ilimitado', included: true },
        { label: 'Vitrine personalizada', included: true },
        { label: 'Agente IA no WhatsApp', included: true },
        { label: 'Domínio próprio', included: true },
        { label: 'Multi-loja', included: true },
        { label: 'Suporte dedicado', included: true },
      ],
    },
  ]

  const tableRows = [
    { label: 'Veículos no estoque', starter: 'até 30', pro: 'ilimitado', network: 'ilimitado' },
    { label: 'Vendedores', starter: '1', pro: 'até 10', network: 'ilimitado' },
    { label: 'Agente IA WhatsApp', starter: false, pro: true, network: true },
    { label: 'Vitrine personalizada', starter: true, pro: true, network: true },
    { label: 'Domínio próprio', starter: false, pro: true, network: true },
    { label: 'Multi-loja', starter: false, pro: false, network: true },
    { label: 'Suporte', starter: 'E-mail', pro: 'Prioritário', network: 'Dedicado' },
  ]

  const cell = (v: string | boolean) => {
    if (v === true) return <Check className="mx-auto size-5 text-blue-600" strokeWidth={3} />
    if (v === false) return <span className="text-slate-300">—</span>
    return <span className="text-sm font-semibold text-slate-700">{v}</span>
  }

  return (
    <section id="planos" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Escolha o plano. <br />
            <span className="text-slate-400">Combine o preço com a gente.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            Cada concessionária tem um tamanho. Em 5 minutos no WhatsApp a gente entende seu
            cenário e manda uma proposta justa.
          </p>
        </div>

        {/* Mobile: stacked cards */}
        <div className="grid grid-cols-1 gap-5 md:hidden">
          {plans.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>

        {/* Desktop: comparison table */}
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="grid grid-cols-4 gap-0">
            <div className="border-b border-slate-200 bg-slate-50/60 p-6" />
            <PlanHeader name="Starter" desc="Loja começando" />
            <PlanHeader name="Pro" desc="Concessionária ativa" highlighted />
            <PlanHeader name="Network" desc="Rede de lojas" />
          </div>

          {tableRows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-4 items-center ${
                i !== tableRows.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className="bg-slate-50/60 px-6 py-4 text-sm font-medium text-slate-700">
                {row.label}
              </div>
              <div className="px-6 py-4 text-center">{cell(row.starter)}</div>
              <div className="bg-blue-50/40 px-6 py-4 text-center">{cell(row.pro)}</div>
              <div className="px-6 py-4 text-center">{cell(row.network)}</div>
            </div>
          ))}

          <div className="grid grid-cols-4 items-center border-t border-slate-200 bg-slate-50/60">
            <div className="px-6 py-5 text-sm font-medium text-slate-700">Preço</div>
            {(['starter', 'pro', 'network'] as const).map((p) => (
              <div
                key={p}
                className={`px-4 py-5 text-center ${p === 'pro' ? 'bg-blue-50/40' : ''}`}
              >
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${
                    p === 'pro'
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <WhatsappIcon className="size-3.5" />
                  Consultar
                </a>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Resposta em até 1 hora útil. Sem ligação chata, sem vendedor insistente.
        </p>
      </div>
    </section>
  )
}

function PlanHeader({
  name,
  desc,
  highlighted = false,
}: {
  name: string
  desc: string
  highlighted?: boolean
}) {
  return (
    <div
      className={`relative border-b border-slate-200 px-6 py-6 text-center ${
        highlighted ? 'bg-blue-50/60' : ''
      }`}
    >
      {highlighted && (
        <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Popular
        </span>
      )}
      <div className="text-lg font-extrabold text-slate-900">{name}</div>
      <div className="mt-1 text-xs text-slate-500">{desc}</div>
    </div>
  )
}

function PlanCard({
  name,
  desc,
  features,
  highlighted = false,
}: {
  name: string
  desc: string
  features: { label: string; value?: string; included: boolean }[]
  highlighted?: boolean
}) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-7 transition-all ${
        highlighted
          ? 'border-blue-600 bg-slate-950 text-white shadow-2xl shadow-blue-600/10 md:-translate-y-2'
          : 'border-slate-200 bg-white'
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 right-6 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/30">
          Mais popular
        </span>
      )}

      <div>
        <div
          className={`text-2xl font-extrabold tracking-tight ${
            highlighted ? 'text-white' : 'text-slate-900'
          }`}
        >
          {name}
        </div>
        <div
          className={`mt-1 text-sm ${highlighted ? 'text-white/60' : 'text-slate-500'}`}
        >
          {desc}
        </div>
      </div>

      <div
        className={`my-6 h-px w-full ${highlighted ? 'bg-white/10' : 'bg-slate-100'}`}
      />

      <ul className="flex-1 space-y-3">
        {features.map((f) => (
          <li key={f.label} className="flex items-start gap-3 text-sm">
            {f.included ? (
              <span
                className={`mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full ${
                  highlighted ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : (
              <span
                className={`mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full ${
                  highlighted ? 'bg-white/5 text-white/30' : 'bg-slate-100 text-slate-300'
                }`}
              >
                <X className="size-2.5" strokeWidth={3} />
              </span>
            )}
            <span
              className={`flex-1 ${
                f.included
                  ? highlighted
                    ? 'text-white/90'
                    : 'text-slate-700'
                  : highlighted
                  ? 'text-white/40 line-through'
                  : 'text-slate-400 line-through'
              }`}
            >
              {f.label}
              {f.value && (
                <span
                  className={`ml-1 font-semibold ${
                    highlighted ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  · {f.value}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener"
        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${
          highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-500'
            : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        <WhatsappIcon className="size-4" />
        Consultar preço
      </a>
    </div>
  )
}

/* ─────────────────────────── FAQ ─────────────────────────── */

function Faq() {
  const items = [
    {
      q: 'Por que vocês não mostram o preço no site?',
      a: 'Porque concessionária com 20 carros não paga o mesmo que rede com 5 lojas. Em 5 minutos no WhatsApp a gente entende seu cenário e manda uma proposta justa — sem vendedor insistente.',
    },
    {
      q: 'Preciso saber programar pra usar?',
      a: 'Não. Tudo é configurado por painel — botões, formulários e upload de imagem. Em 10 minutos sua loja está no ar.',
    },
    {
      q: 'E se a IA responder uma besteira pro cliente?',
      a: 'Você define os limites. Há modo de revisão (humano aprova antes de enviar) e log completo de toda conversa. Nunca é caixa-preta.',
    },
    {
      q: 'Posso usar meu domínio próprio?',
      a: 'Sim, no plano Pro em diante. carros.suamarca.com.br aponta direto pra sua vitrine.',
    },
    {
      q: 'Funciona com meu WhatsApp atual?',
      a: 'Sim. Suportamos WhatsApp Business API oficial — sem risco de banimento.',
    },
    {
      q: 'E meus dados? Ficam com vocês?',
      a: 'Seus dados são seus. Exportação em CSV a qualquer momento. Cancelou? Levamos seu backup completo.',
    },
  ]

  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-12 text-center text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Perguntas frequentes
        </h2>
        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-base font-semibold text-slate-900 sm:text-lg">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-slate-500 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm text-slate-600">{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── FINAL CTA ─────────────────────────── */

function FinalCta() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-5xl font-extrabold leading-[0.95] tracking-tight text-slate-900 sm:text-6xl">
          Cada lead que dorme na <br />
          caixa de mensagem é um <br />
          <span className="text-blue-600">cliente do concorrente.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base text-slate-500">
          O CarGrow trabalha pra você 24 horas por dia. Comece grátis — em 14 dias decida se vale.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
          >
            <WhatsappIcon className="size-5" />
            Falar no WhatsApp
          </a>
          <Link
            href={LOGIN_URL}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-4 text-base font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Já sou cliente
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── FOOTER ─────────────────────────── */

type FooterLink = { label: string; href?: string; soon?: boolean; external?: boolean }

function Footer() {
  const cols: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Produto',
      links: [
        { label: 'Vitrine', href: '#recursos' },
        { label: 'Agente IA', href: '#recursos' },
        { label: 'CRM', href: '#recursos' },
        { label: 'Integrações', href: '#recursos' },
        { label: 'Planos', href: '#planos' },
      ],
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Sobre', soon: true },
        { label: 'Blog', soon: true },
        { label: 'Contato', href: WHATSAPP_LINK, external: true },
        { label: 'Trabalhe conosco', soon: true },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Termos de uso', soon: true },
        { label: 'Política de privacidade', soon: true },
        { label: 'LGPD', soon: true },
        { label: 'Status', soon: true },
      ],
    },
  ]

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-slate-500">
              A plataforma que vende carro pela sua loja enquanto você dorme.
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <WhatsappIcon className="size-4" />
              Falar com o time
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((col) => (
              <div key={col.title}>
                <div className="mb-4 text-sm font-bold text-slate-900">{col.title}</div>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.soon ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                          {link.label}
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            em breve
                          </span>
                        </span>
                      ) : (
                        <a
                          href={link.href}
                          {...(link.external ? { target: '_blank', rel: 'noopener' } : {})}
                          className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-slate-100 pt-8">
          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} CarGrow. Todos os direitos reservados.</div>
            <div className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="shrink-0" />
              Av. João Paulino Vieira Filho, 305 - Sala 106 - Zona 7, Maringá - PR, 87020-015
            </div>
          </div>
        </div>
      </div>
      {/* Floating WhatsApp */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-transform hover:-translate-y-0.5"
      >
        <WhatsappIcon className="size-5" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </footer>
  )
}
