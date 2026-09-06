import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { formatPrice } from '@/lib/format'
import { isVideoAsset, type Tour } from '@/lib/content'

export function TourHero({ tour, locale }: { tour: Tour; locale: 'vi' | 'en' }) {
  const t = useTranslations('tour')
  const cover = isVideoAsset(tour.heroMedia) ? tour.heroMedia.poster : tour.heroMedia

  return (
    <section className="relative h-[80svh] w-full overflow-hidden">
      <Media
        media={cover}
        locale={locale}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-16">
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-6xl">
          {tour.title[locale] ?? tour.title.vi}
        </h1>
        <p className="mt-3 text-lg text-sand-200">{tour.tagline[locale] ?? tour.tagline.vi}</p>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <dt className="text-ink-500">{t('duration')}</dt>
            <dd className="text-lg">{t('durationDays', { n: tour.durationDays })}</dd>
          </div>
          <div>
            <dt className="text-ink-500">{t('priceFrom')}</dt>
            <dd className="text-lg">{formatPrice(tour.priceFrom, locale)}</dd>
          </div>
          <div>
            <dt className="text-ink-500">{t('destinations')}</dt>
            <dd className="text-lg">
              {tour.destinations.map((d) => d[locale] ?? d.vi).join(' · ')}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
