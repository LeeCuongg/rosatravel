import { Star } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/cn'
import { isPopulated, toImage } from '@/lib/data/mappers'
import type { Review } from '@/payload-types'

export function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations('Reviews')
  const avatar = toImage(review.avatar, 'thumbnail')
  const tour = isPopulated(review.tour) ? review.tour : null

  return (
    <figure className="flex h-full flex-col gap-4 rounded-md bg-canvas-soft p-6">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            aria-hidden
            className={cn('size-4', index < review.rating ? 'fill-primary text-primary' : 'text-mute')}
          />
        ))}
        <span className="sr-only">{t('stars', { rating: review.rating })}</span>
      </div>
      <blockquote className="flex-1 text-body-md text-ink">“{review.quote}”</blockquote>
      <figcaption className="flex items-center gap-3">
        {avatar ? (
          <Image src={avatar.url} alt="" width={48} height={48} className="size-12 rounded-pill object-cover" />
        ) : (
          <span
            aria-hidden
            className="flex size-12 items-center justify-center rounded-pill bg-mute/40 font-display font-semibold text-ink"
          >
            {review.customerName.charAt(0)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-semibold text-ink">{review.customerName}</span>
          {review.location ? <span className="block text-caption text-body">{review.location}</span> : null}
          {tour ? <span className="block truncate text-caption text-body-mid">{tour.title}</span> : null}
        </span>
      </figcaption>
    </figure>
  )
}
