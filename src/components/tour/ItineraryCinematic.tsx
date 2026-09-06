'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { scrubSmoothing } from '@/lib/motion/tokens'
import type { ItineraryDay } from '@/lib/content'

export function ItineraryCinematic({
  days,
  locale,
}: {
  days: ItineraryDay[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('tour')
  const tier = useMotionTier()
  const rootRef = useRef<HTMLDivElement>(null)
  const canParallax = tier === 'full'

  useEffect(() => {
    if (!canParallax) return
    const root = rootRef.current
    if (!root) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const setup = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      const images = root.querySelectorAll<HTMLElement>('[data-parallax]')
      const tweens = Array.from(images).map((el) =>
        // Dịch bằng yPercent (transform) chứ không phải background-position:
        // background-position buộc trình duyệt vẽ lại toàn bộ vùng mỗi frame.
        gsap.fromTo(
          el,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: scrubSmoothing,
            },
          },
        ),
      )

      cleanup = () => {
        tweens.forEach((tween) => {
          tween.scrollTrigger?.kill()
          tween.kill()
        })
      }
    }

    setup().catch((error) => {
      console.error('Không tải được GSAP để chạy parallax lịch trình:', error)
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [canParallax])

  return (
    <section ref={rootRef} className="mx-auto max-w-5xl px-6 py-(--spacing-section)">
      <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
        {t('itinerary')}
      </h2>
      <ol className="mt-12 space-y-20">
        {days.map((day) => (
          <li key={day.day}>
            <Reveal>
              <p className="text-sm uppercase tracking-widest text-clay-500">
                {t('day', { n: day.day })}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl">
                {day.title[locale] ?? day.title.vi}
              </h3>
              <p className="mt-3 text-ink-500">
                {day.description[locale] ?? day.description.vi}
              </p>
            </Reveal>
            {day.media && (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg">
                <div data-parallax className="absolute inset-x-0 -top-[8%] h-[116%]">
                  <Media
                    media={day.media}
                    locale={locale}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
