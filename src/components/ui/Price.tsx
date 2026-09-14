import { useTranslations } from 'next-intl'

import { cn } from '@/lib/cn'
import { formatVnd } from '@/lib/format'

type PriceProps = {
  price: number
  originalPrice?: number | null
  size?: 'md' | 'lg'
  /** Hiện chữ "Chỉ từ" trước giá. */
  showFrom?: boolean
  className?: string
}

// Gốc là <span> để đặt được bên trong link/span mà không sai cấu trúc HTML.
export function Price({ price, originalPrice, size = 'md', showFrom = false, className }: PriceProps) {
  const t = useTranslations('Tour')
  const original = typeof originalPrice === 'number' && originalPrice > price ? originalPrice : null

  return (
    <span className={cn('flex flex-col items-end leading-tight', className)}>
      {original !== null ? (
        <span className="text-caption text-body-mid">
          <span className="sr-only">{t('originalPrice')}: </span>
          <s>{formatVnd(original)}</s>
        </span>
      ) : null}
      <span
        className={cn(
          'font-bold text-primary',
          size === 'lg' ? 'text-display-sub-sm' : 'text-display-xs',
        )}
      >
        {showFrom ? (
          <span className="mr-1 text-caption font-normal text-body">{t('from')}</span>
        ) : (
          <span className="sr-only">{t('price')}: </span>
        )}
        {formatVnd(price)}
      </span>
    </span>
  )
}
