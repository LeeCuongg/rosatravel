'use client'

import { Eye } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { usePathname } from '@/i18n/navigation'

/** Chỉ hiện khi nhân viên mở trang từ nút xem trước trong admin. */
export function DraftModeBar() {
  const t = useTranslations('Preview')
  const pathname = usePathname()

  return (
    <div className="bg-ink text-on-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-2 text-caption lg:px-8">
        <p className="flex items-center gap-2">
          <Eye aria-hidden className="size-4 text-primary" />
          {t('banner')}
        </p>
        {/* Thẻ <a> thường: route handler, không để Link prefetch làm mất cookie xem nháp. */}
        <a
          href={`/next/exit-preview?path=${encodeURIComponent(pathname)}`}
          className="font-semibold underline underline-offset-4 hover:text-primary"
        >
          {t('exit')}
        </a>
      </div>
    </div>
  )
}
