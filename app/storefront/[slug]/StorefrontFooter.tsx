import { formatPhone } from '@/lib/formatPhone'
import { WhatsAppIcon, PhoneIcon, EmailIcon, LocationIcon, InstagramIcon, FacebookIcon, TikTokIcon, YouTubeIcon } from './storefront-icons'

interface StorefrontFooterProps {
  store: {
    name: string
    logo_url?: string | null
    phone?: string | null
    landline?: string | null
    email?: string | null
    address?: string | null
    description?: string | null
  }
  whatsappPhone: string
  sf: {
    layout_theme?: string
    instagram_url?: string
    facebook_url?: string
    tiktok_url?: string
    youtube_url?: string
  }
}

export function StorefrontFooter({ store, whatsappPhone, sf }: StorefrontFooterProps) {
  const isPremium = sf.layout_theme === 'premium'

  if (isPremium) {
    const aboutText = store.description || `${store.name} — qualidade e confiança em veículos.`
    return (
      <footer className="mt-0 bg-gray-800 text-gray-300">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {/* Col 1: Logo + brand */}
            <div className="space-y-3">
              {store.logo_url && (
                <img src={store.logo_url} alt={store.name} className="h-12 w-auto object-contain brightness-0 invert opacity-80" />
              )}
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{aboutText}</p>
            </div>

            {/* Col 2: Contato */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Fale Conosco</h3>
              <div className="space-y-2 text-sm">
                {whatsappPhone && (
                  <a href={`https://wa.me/55${whatsappPhone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <WhatsAppIcon className="w-4 h-4 flex-shrink-0 text-green-500" />
                    WhatsApp: {formatPhone(store.phone)}
                  </a>
                )}
                {store.landline && (
                  <a href={`tel:${store.landline.replace(/\D/g, '')}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                    Telefone: {formatPhone(store.landline)}
                  </a>
                )}
                {store.email && (
                  <a href={`mailto:${store.email}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <EmailIcon className="w-4 h-4 flex-shrink-0" />
                    {store.email}
                  </a>
                )}
                {store.address && (
                  <p className="flex items-start gap-2 text-gray-400">
                    <LocationIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {store.address}
                  </p>
                )}
              </div>
            </div>

            {/* Col 3: Redes sociais */}
            <div className="space-y-3">
              {(sf.instagram_url || sf.facebook_url || sf.tiktok_url || sf.youtube_url) && (
                <>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Redes Sociais</h3>
                  <div className="flex items-center gap-2.5">
                    {sf.instagram_url && (
                      <a href={sf.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                        <InstagramIcon />
                      </a>
                    )}
                    {sf.facebook_url && (
                      <a href={sf.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                        <FacebookIcon />
                      </a>
                    )}
                    {sf.tiktok_url && (
                      <a href={sf.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                        <TikTokIcon />
                      </a>
                    )}
                    {sf.youtube_url && (
                      <a href={sf.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                        <YouTubeIcon />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-700 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
            </span>
            <a href="https://vtauto.com.br" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-40 hover:opacity-70 transition-opacity" title="Desenvolvido por VT Auto">
              <span className="text-xs text-gray-500">Desenvolvido por</span>
              <img src="/vt-auto-logo.svg" alt="VT Auto" className="h-5 w-auto invert" />
            </a>
          </div>
        </div>
      </footer>
    )
  }

  // Theme-adapted classes for default footer (padrao / vtlx / vtclass)
  const isVTClass = sf.layout_theme === 'vtclass'
  const isVTLX = sf.layout_theme === 'vtlx'

  const btnRounded = isVTClass ? 'rounded-none' : isVTLX ? 'rounded-full' : 'rounded-lg'
  const iconRounded = isVTClass ? 'rounded-none' : isVTLX ? 'rounded-full' : 'rounded-lg'
  const logoRounded = isVTClass ? 'rounded-none' : 'rounded-lg'
  const storeNameClass = isVTClass ? 'font-bold text-gray-900 text-base uppercase tracking-wide' : 'font-bold text-gray-900 text-base'
  const footerBorder = isVTClass ? 'border-t-2 border-gray-300' : 'border-t border-gray-200'

  return (
    <footer className={`mt-12 ${footerBorder} bg-white`}>
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {store.logo_url && (
                <img src={store.logo_url} alt="" className={`h-8 w-8 ${logoRounded} object-cover`} />
              )}
              <span className={storeNameClass}>{store.name}</span>
            </div>
            <div className="flex flex-col gap-2">
              {whatsappPhone && (
                <a href={`https://wa.me/55${whatsappPhone}`} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 self-start bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 ${btnRounded} transition-colors`}>
                  <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
                  WhatsApp {formatPhone(store.phone)}
                </a>
              )}
              {store.landline && (
                <a href={`tel:${store.landline.replace(/\D/g, '')}`}
                  className={`inline-flex items-center gap-2 self-start text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 ${btnRounded} border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-colors`}>
                  <PhoneIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  Telefone {formatPhone(store.landline)}
                </a>
              )}
              {store.email && (
                <a href={`mailto:${store.email}`}
                  className={`inline-flex items-center gap-2 self-start text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 ${btnRounded} border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-colors`}>
                  <EmailIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  {store.email}
                </a>
              )}
            </div>
            {store.address && (
              <p className="text-xs text-gray-400 flex items-start gap-1.5 max-w-xs">
                <LocationIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {store.address}
              </p>
            )}
          </div>

          {(sf.instagram_url || sf.facebook_url || sf.tiktok_url || sf.youtube_url) && (
            <div className="flex items-center gap-2">
              {sf.instagram_url && (
                <a href={sf.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className={`w-9 h-9 ${iconRounded} bg-gray-100 hover:bg-pink-50 hover:text-pink-600 text-gray-500 flex items-center justify-center transition-colors`}>
                  <InstagramIcon />
                </a>
              )}
              {sf.facebook_url && (
                <a href={sf.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className={`w-9 h-9 ${iconRounded} bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 flex items-center justify-center transition-colors`}>
                  <FacebookIcon />
                </a>
              )}
              {sf.tiktok_url && (
                <a href={sf.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                  className={`w-9 h-9 ${iconRounded} bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors`}>
                  <TikTokIcon />
                </a>
              )}
              {sf.youtube_url && (
                <a href={sf.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                  className={`w-9 h-9 ${iconRounded} bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 flex items-center justify-center transition-colors`}>
                  <YouTubeIcon />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className={`text-xs text-gray-400 ${isVTClass ? 'uppercase tracking-wide' : ''}`}>
            &copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
          </span>
          <a href="https://vtauto.com.br" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity" title="Desenvolvido por VT Auto">
            <span className="text-xs text-gray-400">Desenvolvido por</span>
            <img src="/vt-auto-logo.svg" alt="VT Auto" className="h-5 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  )
}
