'use client'

import { useEffect } from 'react'
import { useMotionTier } from './MotionTierProvider'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const tier = useMotionTier()

  useEffect(() => {
    if (tier === 'reduced') return

    let cancelled = false
    let cleanup: (() => void) | undefined

    // Import động: Lenis và GSAP không nằm trong bundle ban đầu.
    const setup = async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return

      gsap.registerPlugin(ScrollTrigger)

      const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })

      // ScrollTrigger phải cập nhật theo tiến độ của Lenis, không theo sự kiện
      // scroll gốc — nếu không, vị trí pin sẽ trễ một frame và thấy rung.
      lenis.on('scroll', ScrollTrigger.update)

      const raf = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)

      cleanup = () => {
        gsap.ticker.remove(raf)
        lenis.destroy()
        // Không kill ScrollTrigger ở đây. Component nào tạo trigger thì tự kill
        // trong cleanup của mình; kill toàn cục sẽ xoá luôn trigger mà component
        // con vừa tạo lại khi tier đổi, vì thứ tự cleanup parent/child không đảm bảo.
      }
    }

    setup().catch((error) => {
      console.error('Không khởi tạo được smooth scroll; trang vẫn cuộn bình thường.', error)
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [tier])

  return <>{children}</>
}
