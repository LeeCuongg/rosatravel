import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { formatPrice } from '@/lib/format'
import { isVideoAsset } from '@/lib/content/guards'
import type { Tour } from '@/lib/content'

export function TourCard({ tour, locale }: { tour: Tour; locale: 'vi' | 'en' }) {
  const t = useTranslations('tour')
  const cover = isVideoAsset(tour.heroMedia) ? tour.heroMedia.poster : tour.heroMedia

  return (
    <Link href={`/tour/${tour.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
        <Media
          media={cover}
          locale={locale}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl">
            {tour.title[locale] ?? tour.title.vi}
          </h3>
          <p className="mt-1 text-sm text-sand-200">
            {tour.durationDays} ngày · {t('priceFrom')} {formatPrice(tour.priceFrom, locale)}
          </p>
        </div>
      </div>
    </Link>
  )
}
