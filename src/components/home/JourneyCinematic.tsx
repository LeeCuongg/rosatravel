'use client'

import { useEffect, useRef } from 'react'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import type { HomeContent } from '@/lib/content'

interface JourneyProps {
  journey: HomeContent['journey']
  locale: 'vi' | 'en'
}

export function JourneyCinematic({ journey, locale }: JourneyProps) {
  const tier = useMotionTier()
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const canPin = tier === 'full'

  useEffect(() => {
    if (!canPin) return
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const setup = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      // Quãng cuộn ngang = phần tràn ra ngoài viewport. Dùng hàm thay vì giá trị
      // cố định để ScrollTrigger tính lại đúng khi đổi kích thước cửa sổ.
      const overflow = () => track.scrollWidth - window.innerWidth

      const tween = gsap.to(track, {
        x: () => -overflow(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${overflow()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })

      cleanup = () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    }

    // Import động: lỗi tải GSAP không được làm sập trang — chỉ ghi log, dải
    // ảnh vẫn hiển thị tĩnh (không pin, không cuộn ngang).
    setup().catch((error) => {
      console.error('Không tải được GSAP để chạy hiệu ứng cuộn ngang hành trình:', error)
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [canPin])

  const headline = journey.headline[locale] ?? journey.headline.vi

  if (!canPin) {
    // Tier lite/reduced: lưới dọc bình thường. Đây là một trải nghiệm hoàn chỉnh
    // riêng, không phải bản desktop bị cắt xén.
    return (
      <section className="mx-auto max-w-7xl px-6 py-(--spacing-section)">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
          {headline}
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {journey.stops.map((stop, index) => (
            <Reveal key={stop.label.vi} delay={index * 0.06}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Media
                  media={stop.image}
                  locale={locale}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                <span className="absolute bottom-4 left-4 text-lg">
                  {stop.label[locale] ?? stop.label.vi}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="h-svh overflow-hidden">
      <div className="flex h-full items-center">
        <div ref={trackRef} className="flex gap-8 pl-6 will-change-transform">
          <div className="flex w-[40vw] shrink-0 items-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-5xl leading-tight">
              {headline}
            </h2>
          </div>
          {journey.stops.map((stop) => (
            <figure
              key={stop.label.vi}
              className="relative h-[70vh] w-[50vw] shrink-0 overflow-hidden rounded-lg"
            >
              <Media
                media={stop.image}
                locale={locale}
                fill
                sizes="50vw"
                className="object-cover"
              />
              <figcaption className="absolute bottom-6 left-6 text-2xl">
                {stop.label[locale] ?? stop.label.vi}
              </figcaption>
            </figure>
          ))}
          <div className="w-[10vw] shrink-0" aria-hidden />
        </div>
      </div>
    </section>
  )
}
