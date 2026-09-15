import { Mail, MapPin, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { BookingForm, type DepartureOption } from '@/components/forms/BookingForm'
import { PageHero } from '@/components/layout/PageHero'
import { TourCard } from '@/components/tour/TourCard'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { Container } from '@/components/ui/Container'
import { buildChannelLinks, hotlineHref } from '@/lib/contact'
import { todayInVietnam } from '@/lib/booking/schema'
import { toContactSettings, toTourSummary, upcomingDepartures } from '@/lib/data/mappers'
import { getPageBySlug, getSiteSettings, getTourBySlug } from '@/lib/data/queries'
import { formatVnd } from '@/lib/format'
import { firstParam } from '@/lib/url'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// Nội dung giới thiệu của trang này sửa trong admin: tạo Trang tĩnh có slug "lien-he".
const CONTENT_SLUG = 'lien-he'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [page, t] = await Promise.all([
    getPageBySlug(CONTENT_SLUG, locale),
    getTranslations({ locale, namespace: 'ContactPage' }),
  ])
  return {
    title: page?.seo?.title || page?.title || t('title'),
    description: page?.seo?.description || t('description'),
    alternates: { canonical: '/lien-he' },
  }
}

export default async function ContactPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  setRequestLocale(locale)

  const tourSlug = firstParam(query.tour)
  const [page, settings, t, tForm, tChannels, format, interestedTour] = await Promise.all([
    getPageBySlug(CONTENT_SLUG, locale),
    getSiteSettings(locale),
    getTranslations('ContactPage'),
    getTranslations('BookingForm'),
    getTranslations('Contact'),
    getFormatter(),
    tourSlug && /^[a-z0-9-]{1,120}$/.test(tourSlug) ? getTourBySlug(tourSlug, locale) : Promise.resolve(null),
  ])

  const contact = toContactSettings(settings)
  const tel = hotlineHref(contact)
  const channels = buildChannelLinks(contact)
  const tourSummary = interestedTour ? toTourSummary(interestedTour) : null

  // Chỉ cho chọn ngày còn nhận khách; "Ngày khác" luôn có sẵn trong form.
  const today = todayInVietnam()
  const departureOptions: DepartureOption[] = interestedTour
    ? upcomingDepartures(interestedTour.departures)
        .filter((departure) => departure.status === 'available' || departure.status === 'limited')
        .map((departure) => ({
          value: departure.date.slice(0, 10),
          label: `${format.dateTime(new Date(departure.date), { day: '2-digit', month: '2-digit', year: 'numeric' })} – ${formatVnd(departure.price || interestedTour.price)}`,
        }))
        .filter((option) => option.value >= today)
    : []

  return (
    <>
      <PageHero title={page?.title || t('title')} description={page ? null : t('description')} />
      <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:py-14">
        <div className="space-y-10">
          {tourSummary ? (
            <section className="space-y-4">
              <h2 className="font-display text-display-xs font-semibold text-ink">{t('interestedIn')}</h2>
              <div className="max-w-sm">
                <TourCard tour={tourSummary} />
              </div>
            </section>
          ) : null}

          <section id="gui-yeu-cau" className="scroll-mt-24 space-y-6 rounded-md border border-mute/60 p-5 sm:p-8">
            <div className="space-y-2">
              <h2 className="font-display text-display-sub-sm font-semibold text-balance text-ink">
                {tourSummary ? tForm('bookingTitle') : tForm('consultationTitle')}
              </h2>
              <p className="text-body-md text-body">
                {tourSummary ? tForm('bookingDescription') : tForm('consultationDescription')}
              </p>
            </div>
            <BookingForm
              type={tourSummary ? 'booking' : 'consultation'}
              tourId={tourSummary ? interestedTour?.id : undefined}
              departures={departureOptions}
              successMessage={settings.bookingSuccessMessage}
            />
          </section>
          {page ? <RenderBlocks blocks={page.layout} locale={locale} variant="stack" /> : null}
        </div>

        <aside className="h-fit space-y-6 rounded-md bg-canvas-soft p-6">
          {tel ? (
            <div className="space-y-1">
              <p className="text-caption font-semibold tracking-[1px] text-body uppercase">{t('hotline')}</p>
              <a
                href={tel}
                className="inline-flex items-center gap-2 font-display text-display-sub-sm font-semibold text-ink hover:text-primary"
              >
                <Phone aria-hidden className="size-6 text-primary" />
                {contact.hotline}
              </a>
            </div>
          ) : null}
          {settings.email ? (
            <div className="space-y-1">
              <p className="text-caption font-semibold tracking-[1px] text-body uppercase">{t('email')}</p>
              <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 break-all text-body-md text-ink hover:text-primary">
                <Mail aria-hidden className="size-5 shrink-0 text-body" />
                {settings.email}
              </a>
            </div>
          ) : null}
          {settings.address ? (
            <div className="space-y-1">
              <p className="text-caption font-semibold tracking-[1px] text-body uppercase">{t('address')}</p>
              <p className="flex gap-2 text-body-md whitespace-pre-line text-ink">
                <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-body" />
                {settings.address}
              </p>
            </div>
          ) : null}
          {channels.length ? (
            <div className="space-y-3">
              <p className="text-caption font-semibold tracking-[1px] text-body uppercase">{t('channels')}</p>
              <ul className="grid gap-2">
                {channels.map((channel) => (
                  <li key={channel.key}>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 items-center gap-3 rounded-md bg-canvas px-4 font-semibold text-ink transition-colors hover:bg-ink hover:text-on-primary focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <BrandIcon channel={channel.key} className="size-5" />
                      {tChannels(`channels.${channel.key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </Container>
    </>
  )
}
