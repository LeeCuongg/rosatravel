'use client'

import { motion } from 'motion/react'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { distance, duration, easingArray } from '@/lib/motion/tokens'

interface RevealProps {
  children: React.ReactNode
  /** Trễ thêm, đơn vị giây. Dùng cùng `stagger` khi reveal một nhóm. */
  delay?: number
  className?: string
}

/**
 * Component reveal dùng chung cho MỌI hiệu ứng vào-viewport.
 *
 * Không viết `whileInView` trực tiếp trong section: timing sẽ trôi dạt mỗi nơi
 * một kiểu và không thể chỉnh tập trung.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const tier = useMotionTier()
  const shouldTranslate = tier !== 'reduced'

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: shouldTranslate ? distance : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{
        duration: tier === 'reduced' ? duration.fast : duration.slow,
        delay,
        ease: easingArray.enter,
      }}
    >
      {children}
    </motion.div>
  )
}
