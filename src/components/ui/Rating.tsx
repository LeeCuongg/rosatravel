import { Star } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import { cn } from '@/lib/cn'

type RatingProps = {
  average: number
  count: number
  bookedCount?: number | null
  className?: string
}

export function Rating({ average, count, bookedCount, className }: RatingProps) {
  const t = useTranslations('Tour')
  const format = useFormatter()
  const averageText = format.number(average, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <p className={cn('flex flex-wrap items-center gap-x-1.5 text-caption text-body', className)}>
      <Star aria-hidden className="size-4 fill-primary text-primary" />
      <span aria-hidden>
        {averageText} ({format.number(count)})
      </span>
      <span className="sr-only">{t('rating', { average: averageText, count: format.number(count) })}</span>
      {bookedCount ? (
        <>
          <span aria-hidden className="text-mute">
            |
          </span>
          <span>{t('booked', { count: format.number(bookedCount) })}</span>
        </>
      ) : null}
    </p>
  )
}
