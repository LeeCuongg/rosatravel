'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Eyebrow } from '@/components/ui/Frame'
import { DaySection } from '@/components/story/DaySection'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { scrubSmoothing } from '@/lib/motion/tokens'
import type { ItineraryDay } from '@/lib/content'

/**
 * Lịch trình tour — mỗi ngày là một mục bài viết, cộng thêm parallax nhẹ cho ảnh.
 *
 * Bố cục từng ngày nằm ở DaySection, dùng CHUNG với bài "Chuyến đã đi". Việc
 * duy nhất còn lại ở file này là lớp GSAP: nó là client component vì cần đo
 * cuộn, còn DaySection thì không cần và vì thế vẫn render trên server.
 *
 * `data-parallax` được DaySection gắn lên từng ô ảnh khi bật cờ; effect dưới
 * đây quét chúng trong phạm vi `rootRef`. Nghĩa là số lượng ảnh mỗi ngày bao
 * nhiêu cũng chạy đúng, không cần sửa gì ở đây.
 */
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
    // Chạy lại khi số ngày đổi: effect quét [data-parallax] MỘT LẦN lúc chạy,
    // nên các ô ảnh xuất hiện sau đó sẽ không có tween nào gắn vào.
  }, [canParallax, days.length])

  return (
    <div ref={rootRef} className="mx-auto max-w-sml px-gutter py-section">
      <Eyebrow>{t('itinerary')}</Eyebrow>
      <ol className="mt-10">
        {days.map((day) => (
          <DaySection
            key={day.day}
            day={day.day}
            title={day.title}
            // Lịch trình tour lưu mô tả ngày thành MỘT đoạn (khác bài "Chuyến
            // đã đi", vốn là mảng). Bọc lại thành mảng một phần tử để dùng
            // chung DaySection thay vì cho nó hai kiểu prop khác nhau.
            paragraphs={[day.description]}
            images={day.images}
            locations={day.locations}
            locationsLabel={day.locationsLabel}
            locale={locale}
            parallax={canParallax}
          />
        ))}
      </ol>
    </div>
  )
}
