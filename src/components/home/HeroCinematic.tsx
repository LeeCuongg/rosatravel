'use client'

import { useEffect, useRef } from 'react'
import { isVideoAsset, type HomeContent } from '@/lib/content'
import { Media } from '@/components/media/Media'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'

interface HeroCinematicProps {
  hero: HomeContent['hero']
  locale: 'vi' | 'en'
}

export function HeroCinematic({ hero, locale }: HeroCinematicProps) {
  const tier = useMotionTier()
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)

  const video = isVideoAsset(hero.media) ? hero.media : null
  // Ảnh nền: poster của video nếu hero là video, ngược lại chính hero.media.
  // Gọi lại isVideoAsset ở đây (thay vì dùng biến `video`) để TypeScript thu hẹp
  // kiểu về ImageAsset — ternary trên `video` không phải type guard cho hero.media.
  const stillImage = isVideoAsset(hero.media) ? hero.media.poster : hero.media
  const canScrub = tier === 'full' && video?.scrubbable === true

  useEffect(() => {
    if (!canScrub) return
    const section = sectionRef.current
    const videoEl = videoRef.current
    if (!section || !videoEl) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const setup = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      // Phải đợi metadata mới biết duration. Nếu không, progress * NaN = NaN
      // và video đứng im — lỗi này rất hay gặp và nhìn giống "scrub không chạy".
      const waitForMetadata = () =>
        videoEl.readyState >= 1
          ? Promise.resolve()
          : new Promise<void>((resolve) =>
              videoEl.addEventListener('loadedmetadata', () => resolve(), { once: true }),
            )

      await waitForMetadata()
      if (cancelled) return

      // Gán currentTime qua một object trung gian để gsap nội suy mượt,
      // thay vì nhảy thẳng theo progress (gây giật khi cuộn nhanh).
      const proxy = { time: 0 }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=180%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          proxy.time = self.progress * videoEl.duration
          gsap.to(videoEl, {
            currentTime: proxy.time,
            duration: 0.2,
            overwrite: true,
            ease: 'none',
          })
        },
      })

      const headlineTween = gsap.fromTo(
        headlineRef.current,
        { yPercent: 0, opacity: 1 },
        {
          yPercent: -40,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '+=90%', scrub: 0.6 },
        },
      )

      cleanup = () => {
        trigger.kill()
        headlineTween.scrollTrigger?.kill()
        headlineTween.kill()
      }
    }

    // Import động: lỗi tải GSAP không được làm sập trang — chỉ ghi log, video
    // vẫn hiển thị (tự phát nếu không scrub được) và ảnh tĩnh vẫn hoạt động.
    setup().catch((error) => {
      console.error('Không tải được GSAP để chạy hiệu ứng cuộn video hero:', error)
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [canScrub])

  return (
    <section ref={sectionRef} className="relative h-svh w-full overflow-hidden">
      {video && tier === 'full' ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          poster={video.poster.src}
          {...(canScrub ? {} : { autoPlay: true, loop: true })}
        >
          <source src={video.webm} type="video/webm" />
          <source src={video.mp4} type="video/mp4" />
        </video>
      ) : (
        <Media
          media={stillImage}
          locale={locale}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950" />

      <div ref={headlineRef} className="relative flex h-full items-end px-6 pb-24">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight sm:text-6xl lg:text-7xl">
            {hero.headline[locale] ?? hero.headline.vi}
          </h1>
          <p className="mt-4 max-w-xl text-sand-200">
            {hero.subline[locale] ?? hero.subline.vi}
          </p>
        </div>
      </div>
    </section>
  )
}
