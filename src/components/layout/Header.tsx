'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { motion, useScroll, useTransform } from 'motion/react'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import type { HomeContent } from '@/lib/content'

export function Header({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('nav')
  const tc = useTranslations('cta')
  const tb = useTranslations('brand')
  const tier = useMotionTier()
  const { scrollY } = useScroll()

  // MotionTierProvider mặc định 'reduced' cho tới khi effect của nó đo xong
  // thiết bị thật — nghĩa là lần render đầu tiên trên client LUÔN là 'reduced',
  // kể cả trên máy mạnh. Không có cờ measured, overlayOpacity dưới đây sẽ khoá
  // cứng ở 1 cho mọi người dùng ngay lần vẽ đầu, phủ một thanh tối đặc lên hero.
  const [measured, setMeasured] = useState(false)
  useEffect(() => setMeasured(true), [])

  // Nền header đậm dần khi rời khỏi hero. Chỉ đổi opacity — không animate
  // backdrop-filter hay background-color, cả hai đều buộc trình duyệt vẽ lại.
  // Hook luôn được gọi vô điều kiện; chỉ giá trị dùng mới phụ thuộc tier.
  const scrolledOpacity = useTransform(scrollY, [0, 240], [0, 1])

  // Tier reduced: cắt hẳn liên kết với scroll, để nền đặc cố định. Hiệu ứng
  // buộc vào vị trí cuộn vẫn là chuyển động dù chỉ đổi opacity, và ở đây đọc
  // được chữ quan trọng hơn việc hoà vào ảnh hero. Coi "chưa đo xong" như
  // KHÔNG PHẢI reduced — nếu không thì mọi người dùng, kể cả máy mạnh, đều
  // thấy một thanh tối phủ lên hero trong khoảnh khắc trước khi tier đo xong.
  const overlayOpacity = measured && tier === 'reduced' ? 1 : scrolledOpacity

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        aria-hidden
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm"
      />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-xl">
          {tb('name')}
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/lien-he"
            className="transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:text-sand-400"
          >
            {t('contact')}
          </Link>
          <a
            href={contact.zaloUrl}
            className="rounded-full bg-clay-600 text-on-clay px-5 py-2 font-medium transition-transform duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:scale-105"
          >
            {tc('zalo')}
          </a>
        </div>
      </nav>
    </header>
  )
}
