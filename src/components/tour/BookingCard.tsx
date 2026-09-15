import { Phone } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'

import { Badge } from '@/components/ui/Badge'
import { buttonClassName } from '@/components/ui/Button'
import { Price } from '@/components/ui/Price'
import { Link } from '@/i18n/navigation'
import { hotlineHref } from '@/lib/contact'
import { upcomingDepartures, type Departure } from '@/lib/data/mappers'
import { formatVnd } from '@/lib/format'
import type { Tour } from '@/payload-types'
import type { ContactSettings } from '@/types/content'

const statusTone: Record<Departure['status'], 'soft' | 'primary' | 'ink'> = {
  available: 'soft',
  limited: 'primary',
  soldout: 'ink',
  cancelled: 'ink',
}

type BookingCardProps = {
  tour: Tour
  bookingHref: string
  contact: ContactSettings
}

/** Khung giá + ngày khởi hành + nút đặt, dính bên phải khi cuộn (desktop). */
export async function BookingCard({ tour, bookingHref, contact }: BookingCardProps) {
  const [t, format] = await Promise.all([getTranslations('Tour'), getFormatter()])
  const departures = upcomingDepartures(tour.departures).slice(0, 5)
  const tel = hotlineHref(contact)
  const href = `${bookingHref}${bookingHref.includes('?') ? '&' : '?'}tour=${encodeURIComponent(tour.slug)}`

  return (
    <aside className="space-y-5 rounded-md border border-mute/60 bg-canvas p-5 lg:sticky lg:top-24">
      <Price price={tour.price} originalPrice={tour.originalPrice} size="lg" showFrom className="items-start" />

      {departures.length ? (
        <div className="space-y-2">
          <h2 className="text-caption font-semibold tracking-[1px] text-body uppercase">{t('upcomingDepartures')}</h2>
          <ul className="divide-y divide-mute/60">
            {departures.map((departure, index) => (
              <li key={departure.id ?? index} className="flex items-center justify-between gap-3 py-2.5 text-body-sm">
                <span className="font-semibold text-ink">
                  {format.dateTime(new Date(departure.date), { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-2">
                  {departure.price && departure.price !== tour.price ? (
                    <span className="text-body">{formatVnd(departure.price)}</span>
                  ) : null}
                  <Badge tone={statusTone[departure.status]}>
                    {departure.status === 'limited' && departure.seatsLeft
                      ? t('seatsLeft', { count: departure.seatsLeft })
                      : t(`departureStatus.${departure.status}`)}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-body-sm text-body">{t('noDepartures')}</p>
      )}

      <div className="grid gap-2">
        <Link href={href} className={buttonClassName({ className: 'w-full' })}>
          {t('bookThisTour')}
        </Link>
        {tel ? (
          <a href={tel} className={buttonClassName({ variant: 'tertiary', className: 'w-full' })}>
            <Phone aria-hidden className="size-5" />
            {contact.hotline}
          </a>
        ) : null}
      </div>
    </aside>
  )
}
