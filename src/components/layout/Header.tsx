'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion, useScroll, useTransform } from 'motion/react'
import type { HomeContent } from '@/lib/content'

export function Header({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('nav')
  const tc = useTranslations('cta')
  const tb = useTranslations('brand')
  const { scrollY } = useScroll()

  // Nền header đậm dần khi rời khỏi hero. Chỉ đổi opacity — không animate
  // backdrop-filter hay background-color, cả hai đều buộc trình duyệt vẽ lại.
  const overlayOpacity = useTransform(scrollY, [0, 240], [0, 1])

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
          <Link href="/lien-he" className="hover:text-sand-400 transition-colors">
            {t('contact')}
          </Link>
          <a
            href={contact.zaloUrl}
            className="rounded-full bg-clay-500 px-5 py-2 font-medium transition-transform hover:scale-105"
          >
            {tc('zalo')}
          </a>
        </div>
      </nav>
    </header>
  )
}
