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
          // Lưới tối đa max-w-7xl (1280px), 3 cột + khoảng cách => thẻ dừng ở
          // ~426px. Để 33vw thì trên màn hình 2560px trình duyệt sẽ đòi ~845px
          // và tải biến thể to vô ích.
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 426px"
          className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-hover)] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl">
            {tour.title[locale] ?? tour.title.vi}
          </h3>
          <p className="mt-1 text-sm text-sand-200">
            {t('durationDays', { n: tour.durationDays })} · {t('priceFrom')}{' '}
            {formatPrice(tour.priceFrom, locale)}
          </p>
        </div>
      </div>
    </Link>
  )
}
