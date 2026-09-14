'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/cn'

type AppLocale = (typeof routing.locales)[number]

type LocaleSwitcherProps = {
  locales?: readonly AppLocale[]
  className?: string
}

/** Tự ẩn khi site chỉ có một ngôn ngữ; thêm locale vào routing là nút tự hiện. */
export function LocaleSwitcher({ locales = routing.locales, className }: LocaleSwitcherProps) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('Nav')

  if (locales.length < 2) {
    return null
  }

  return (
    <nav aria-label={t('language')} className={cn('flex items-center gap-1', className)}>
      {locales.map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          aria-current={code === locale ? 'true' : undefined}
          className={cn(
            'rounded-sm px-2 py-1 text-caption font-semibold uppercase transition-colors duration-(--duration-fast)',
            code === locale ? 'bg-ink text-on-primary' : 'text-ink hover:bg-canvas-soft',
          )}
        >
          {code}
        </Link>
      ))}
    </nav>
  )
}
