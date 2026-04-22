'use client'

import { useEffect, useState } from 'react'

export type BannerSlide = {
  image_url: string
  title: string
  subtitle: string
}

interface Props {
  slides: BannerSlide[]
  isPremium: boolean
  primaryColor: string
  interval?: number
}

export function StorefrontBanner({ slides, isPremium, primaryColor, interval = 6000 }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const validSlides = slides.filter(s => s.image_url || s.title || s.subtitle)
  const count = validSlides.length

  useEffect(() => {
    if (count <= 1 || paused) return
    const id = setInterval(() => {
      setCurrent(prev => (prev + 1) % count)
    }, interval)
    return () => clearInterval(id)
  }, [count, paused, interval])

  if (count === 0) return null

  return (
    <div
      className="relative text-white overflow-hidden h-[180px] sm:h-[380px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {validSlides.map((slide, idx) => {
        const isActive = idx === current
        const bg = isPremium
          ? (slide.image_url
              ? `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25)), url(${slide.image_url}) center/cover no-repeat`
              : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`)
          : (slide.image_url
              ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${slide.image_url}) center/cover no-repeat`
              : primaryColor)

        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ background: bg }}
            aria-hidden={!isActive}
          >
            <div
              className={`max-w-6xl mx-auto px-4 h-full flex flex-col justify-center ${
                isPremium ? '' : 'text-center items-center'
              }`}
            >
              {isPremium ? (
                <>
                  {slide.title && (
                    <h2 className="text-2xl sm:text-5xl font-bold mb-2 sm:mb-4 max-w-2xl leading-tight drop-shadow-sm">
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p className="text-sm sm:text-xl opacity-95 max-w-xl drop-shadow-sm">
                      {slide.subtitle}
                    </p>
                  )}
                </>
              ) : (
                <>
                  {slide.title && (
                    <h2 className="text-xl sm:text-4xl font-bold mb-1 sm:mb-3 drop-shadow-sm">
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p className="text-sm sm:text-xl opacity-95 drop-shadow-sm">
                      {slide.subtitle}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}

      {count > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {validSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
