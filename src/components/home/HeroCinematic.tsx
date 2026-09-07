'use client'

import { useEffect, useRef } from 'react'
// Type-only import: bị xoá lúc biên dịch nên không kéo fs.ts vào bundle trình duyệt.
import type { HomeContent } from '@/lib/content'
// Giá trị runtime phải lấy từ guards, KHÔNG từ barrel '@/lib/content'.
import { isVideoAsset } from '@/lib/content/guards'
import { Media } from '@/components/media/Media'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { scrubSmoothing, scrubTweenDuration } from '@/lib/motion/tokens'

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

  // Pin và reveal tiêu đề chạy ở MỌI hero tier full, kể cả khi chỉ có ảnh tĩnh.
  // Buộc chung điều kiện với video là sai: nội dung có thể không bao giờ có
  // video, và khi đó hero sẽ đứng im hoàn toàn — một "cinematic beat" không
  // chuyển động.
  const canPin = tier === 'full'

  // Scrub chỉ khi thật sự có video scrub được.
  const canScrub = canPin && video?.scrubbable === true

  useEffect(() => {
    if (!canPin) return
    const section = sectionRef.current
    if (!section) return
    const videoEl = videoRef.current

    let cancelled = false
    let cleanup: (() => void) | undefined
    const metadataAbort = new AbortController()

    const setup = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      // Phải đợi metadata mới biết duration. Nếu không, progress * NaN = NaN
      // và video đứng im — lỗi này rất hay gặp và nhìn giống "scrub không chạy".
      // Đăng ký qua AbortSignal để listener tự gỡ nếu effect bị huỷ trước khi
      // metadata kịp tải xong, tránh treo listener + promise không bao giờ resolve.
      const waitForMetadata = () =>
        videoEl && videoEl.readyState >= 1
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              videoEl?.addEventListener('loadedmetadata', () => resolve(), {
                once: true,
                signal: metadataAbort.signal,
              })
            })

      // Chỉ cần đợi metadata khi thật sự scrub video.
      if (canScrub && videoEl) {
        await waitForMetadata()
        if (cancelled) return
      }

      // Gán currentTime qua một object trung gian để gsap nội suy mượt,
      // thay vì nhảy thẳng theo progress (gây giật khi cuộn nhanh).
      const proxy = { time: 0 }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        // Quãng cuộn thuộc về bố cục của section này chứ không phải timing dùng
        // chung — để tại chỗ, không đưa vào token. Có video thì giữ pin lâu hơn
        // để đủ chỗ tua hết clip; chỉ có ảnh thì một màn hình là vừa đủ cho
        // reveal tiêu đề, giữ lâu hơn sẽ thành chặn đường người đọc.
        end: canScrub ? '+=180%' : '+=100%',
        pin: true,
        scrub: scrubSmoothing,
        onUpdate:
          !canScrub || !videoEl
            ? undefined
            : (self) => {
                proxy.time = self.progress * videoEl.duration
                gsap.to(videoEl, {
                  currentTime: proxy.time,
                  duration: scrubTweenDuration,
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
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=90%',
            scrub: scrubSmoothing,
          },
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
      metadataAbort.abort()
      cleanup?.()
    }
  }, [canPin, canScrub])

  return (
    <section ref={sectionRef} className="relative h-svh w-full overflow-hidden">
      {video && tier === 'full' ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          // Hero không scrub (spec: preload="metadata") không cần tải cả video
          // loop ngay — canScrub (desktop, pin+scrub) mới cần preload="auto" vì
          // ScrollTrigger cần frame sẵn sàng để scrub mượt ngay khi vào viewport.
          preload={canScrub ? 'auto' : 'metadata'}
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

      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/75 via-transparent to-ink-950" />

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
