'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Eyebrow } from '@/components/ui/Frame'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { scrubSmoothing, stagger } from '@/lib/motion/tokens'
import type { HomeContent } from '@/lib/content'

interface JourneyProps {
  journey: HomeContent['journey']
  locale: 'vi' | 'en'
}

export function JourneyCinematic({ journey, locale }: JourneyProps) {
  const t = useTranslations('sections')
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
      //
      // Kẹp sàn về 0: hiện tại schema bắt tối thiểu 2 điểm đến và các phần tử
      // rộng theo vw nên tổng luôn vượt màn hình, nhưng ràng buộc đó nằm ở file
      // khác. Nếu ai đó thu hẹp vw hoặc hạ mức tối thiểu, quãng cuộn sẽ âm và
      // pin khoá màn hình mà không có gì di chuyển.
      const overflow = () => Math.max(0, track.scrollWidth - window.innerWidth)

      const tween = gsap.to(track, {
        x: () => -overflow(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${overflow()}`,
          pin: true,
          scrub: scrubSmoothing,
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
      <section className="mx-auto max-w-med px-gutter py-section">
        <Eyebrow>{t('journey')}</Eyebrow>
        <h2 className="font-display text-clay-500 mt-4 text-d2">{headline}</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {journey.stops.map((stop, index) => (
            // key theo index: danh sách cố định, không sắp xếp lại — global home
            // trong Payload có thể dùng lại cùng một ảnh cho nhiều điểm dừng, nên
            // stop.label.vi làm key không đảm bảo duy nhất.
            <Reveal key={index} delay={index * stagger}>
              {/* Chú thích nằm NGOÀI ô ảnh. Để bên trong thì overflow-hidden của
                  ô cắt mất nó — ô đã bị khoá tỉ lệ khung 3/4, không còn chỗ. */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <Media
                  media={stop.image}
                  locale={locale}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <span className="mt-4 block text-label uppercase text-ink-500">
                {stop.label[locale] ?? stop.label.vi}
              </span>
            </Reveal>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="h-svh overflow-hidden">
      <div className="flex h-full items-center">
        <div ref={trackRef} className="flex gap-8 pl-gutter will-change-transform">
          <div className="flex w-[40vw] shrink-0 flex-col justify-center">
            <Eyebrow>{t('journey')}</Eyebrow>
            <h2 className="font-display text-clay-500 mt-5 text-d1">{headline}</h2>
          </div>
          {journey.stops.map((stop, index) => (
            // key theo index: cùng lý do ở nhánh lite/reduced phía trên.
            <figure key={index} className="w-[45vw] shrink-0">
              {/* Chú thích nằm NGOÀI ô ảnh — cùng lý do như nhánh lite ở trên. */}
              <div className="relative h-[70vh] overflow-hidden">
                <Media
                  media={stop.image}
                  locale={locale}
                  fill
                  // Ô rộng đúng 45vw, không phải 50vw. Khai dư là mọi ảnh trong
                  // dải đều tải biến thể lớn hơn một bậc so với thứ được vẽ ra.
                  sizes="45vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-4 text-label uppercase text-ink-500">
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
