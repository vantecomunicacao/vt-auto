import Link from 'next/link'
import { formatPhone } from '@/lib/formatPhone'
import { WhatsAppIcon, PhoneIcon, EmailIcon, InstagramIcon, FacebookIcon, TikTokIcon, YouTubeIcon } from './storefront-icons'

interface StorefrontHeaderProps {
  store: {
    name: string
    logo_url?: string | null
    phone?: string | null
    landline?: string | null
    email?: string | null
    city?: string | null
    state?: string | null
  }
  whatsappPhone: string
  primaryColor: string
  sf: {
    layout_theme?: string
    instagram_url?: string
    facebook_url?: string
    tiktok_url?: string
    youtube_url?: string
  }
  /** If set, renders a "Voltar para a vitrine" link instead of the WhatsApp CTA */
  backHref?: string
}

export function StorefrontHeader({ store, whatsappPhone, primaryColor, sf, backHref }: StorefrontHeaderProps) {
  const isPremium = sf.layout_theme === 'premium'
  const landline = store.landline ?? ''

  if (isPremium) {
    return (
      <header className="bg-white border-b border-gray-200">
        {/* Top bar — contacts */}
        <div className="hidden sm:block border-b border-gray-100" style={{ backgroundColor: primaryColor }}>
          <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between text-white/90 text-xs">
            <div className="flex items-center gap-4">
              {whatsappPhone && (
                <a href={`https://wa.me/55${whatsappPhone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                  <WhatsAppIcon className="w-3 h-3" /> {store.phone}
                </a>
              )}
              {landline && (
                <a href={`tel:${landline.replace(/\D/g, '')}`} className="inline-flex items-center gap-1 hover:text-white transition-colors">
                  <PhoneIcon className="w-3 h-3" /> {formatPhone(landline)}
                </a>
              )}
              {store.email && (
                <a href={`mailto:${store.email}`} className="inline-flex items-center gap-1 hover:text-white transition-colors">
                  <EmailIcon className="w-3 h-3" /> {store.email}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sf.instagram_url && <a href={sf.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white transition-colors"><InstagramIcon className="w-3.5 h-3.5" /></a>}
              {sf.facebook_url && <a href={sf.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white transition-colors"><FacebookIcon className="w-3.5 h-3.5" /></a>}
              {sf.tiktok_url && <a href={sf.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-white transition-colors"><TikTokIcon className="w-3.5 h-3.5" /></a>}
              {sf.youtube_url && <a href={sf.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-white transition-colors"><YouTubeIcon className="w-3.5 h-3.5" /></a>}
            </div>
          </div>
        </div>
        {/* Main header */}
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {store.logo_url && (
              <img src={store.logo_url} alt={`Logo ${store.name}`} className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
            )}
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight truncate">{store.name}</h1>
              {(store.city || store.state) && (
                <p className="text-xs text-gray-400 tracking-wide">{[store.city, store.state].filter(Boolean).join(' — ')}</p>
              )}
            </div>
          </div>
          {backHref ? (
            <Link
              href={backHref}
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-200 hover:border-gray-300 font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Voltar para a vitrine
            </Link>
          ) : whatsappPhone ? (
            <a
              href={`https://wa.me/55${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-md text-sm font-semibold transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Fale Conosco</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          ) : null}
        </div>
      </header>
    )
  }

  // Default header (padrao / vtlx — vtclass has its own detail component)
  return (
    <header style={{ backgroundColor: primaryColor }} className="text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {store.logo_url && (
            <img
              src={store.logo_url}
              alt={`Logo ${store.name}`}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover bg-white flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold leading-tight truncate">{store.name}</h1>
            {(store.city || store.state) && (
              <p className="text-xs opacity-75 hidden sm:block">
                {[store.city, store.state].filter(Boolean).join(' — ')}
              </p>
            )}
          </div>
        </div>
        {backHref ? (
          <Link
            href={backHref}
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Voltar para a vitrine
          </Link>
        ) : whatsappPhone ? (
          <a
            href={`https://wa.me/55${whatsappPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{store.phone}</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        ) : null}
      </div>
    </header>
  )
}
