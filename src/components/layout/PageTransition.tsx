'use client'

import { useSelectedLayoutSegments } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { duration, easingArray } from '@/lib/motion/tokens'

/**
 * Làm mờ rồi hiện lại nội dung trang mỗi khi CHUYỂN TRANG THẬT.
 *
 * Khoá theo `useSelectedLayoutSegments()`, KHÔNG theo `usePathname()`.
 *
 * Vì sao: mở một bài "Chuyến đã đi" từ trang chủ làm đường dẫn đổi từ `/vi`
 * sang `/vi/chuyen-di/x`, nhưng nội dung ở khe `children` thì KHÔNG đổi — bài
 * viết được intercepting route vẽ vào khe `@modal`, còn trang chủ vẫn nằm
 * nguyên phía sau. Khoá theo pathname sẽ coi đó là một lần chuyển trang: trang
 * chủ bị gỡ, làm mờ, rồi dựng lại từ đầu ngay lúc lớp phủ đang trượt lên. Đó
 * chính là cái chớp nháy khiến thao tác mở lớp phủ trông giật cục.
 *
 * `useSelectedLayoutSegments()` chỉ đọc các segment của khe `children`, nên nó
 * đứng yên khi chỉ có khe `@modal` thay đổi — và vẫn đổi bình thường khi người
 * đọc đi từ trang chủ sang `/lien-he` hay một trang tour.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const segments = useSelectedLayoutSegments()
  const tier = useMotionTier()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segments.join('/')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: tier === 'reduced' ? duration.fast : duration.base,
          ease: easingArray.enter,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
