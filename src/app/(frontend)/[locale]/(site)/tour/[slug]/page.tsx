import { Clock, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { BookingCard } from '@/components/tour/BookingCard'
import { TourCard } from '@/components/tour/TourCard'
import { TourGallery } from '@/components/tour/TourGallery'
import { Badge } from '@/components/ui/Badge'
import { Carousel } from '@/components/ui/Carousel'
import { Chip } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { Rating } from '@/components/ui/Rating'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { toContactSettings, toImage, toTourSummary, visible } from '@/lib/data/mappers'
import { getPublishedTourSlugs, getRelatedTours, getSiteSettings, getTourBySlug } from '@/lib/data/queries'
import type { ImageAsset } from '@/types/content'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedTourSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    // Không kết nối được DB lúc build thì trang vẫn được tạo khi có người truy cập.
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const tour = await getTourBySlug(slug, locale)
  if (!tour) return {}

  const image = toImage(tour.seo?.image, 'hero') ?? toImage(tour.coverImage, 'hero')
  return {
    title: tour.seo?.title || tour.title,
    description: tour.seo?.description || tour.summary || undefined,
    openGraph: image ? { images: [{ url: image.url, alt: image.alt }] } : undefined,
    alternates: { canonical: `/tour/${slug}` },
  }
}

export default async function TourPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const [tour, settings, draft, t] = await Promise.all([
    getTourBySlug(slug, locale),
    getSiteSettings(locale),
    draftMode(),
    getTranslations('Tour'),
  ])
  if (!tour) notFound()

  const summary = toTourSummary(tour)
  const destinations = visible(tour.destinations, draft.isEnabled)
  const related = await getRelatedTours(tour, locale)

  const seen = new Set<string>()
  const images = [tour.coverImage, ...(tour.gallery ?? [])]
    .map((media) => toImage(media, 'hero'))
    .filter((image): image is ImageAsset => {
      if (!image || seen.has(image.url)) return false
      seen.add(image.url)
      return true
    })

  return (
    <>
      <Container className="space-y-8 pt-6 lg:pt-10">
        <TourGallery images={images} title={tour.title} />

        {/* Mobile: tiêu đề → khung đặt tour → nội dung. Desktop: khung đặt tour dính cột phải.
            minmax(0,1fr) ở mobile: cột không bị nội dung rộng (bảng giá, chữ dài) kéo tràn màn hình. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-12">
          <header className="space-y-4 lg:col-start-1">
            {summary?.badges?.length ? (
              <div className="flex flex-wrap gap-2">
                {summary.badges.map((badge) => (
                  <Badge key={badge} tone="primary">
                    {badge}
                  </Badge>
                ))}
              </div>
            ) : null}
            <h1 className="font-display text-display-sub-sm font-semibold text-balance text-ink md:text-display-lg">
              {tour.title}
            </h1>
            {tour.summary ? <p className="text-body-lg text-body">{tour.summary}</p> : null}
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-sm text-body">
              <li className="flex items-center gap-2">
                <Clock aria-hidden className="size-4 text-body-mid" />
                {t('duration', { days: tour.durationDays, nights: tour.durationNights })}
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden className="size-4 text-body-mid" />
                {t('departure', { place: tour.departureFrom })}
              </li>
              {summary?.rating ? (
                <li>
                  <Rating average={summary.rating.average} count={summary.rating.count} bookedCount={summary.bookedCount} />
                </li>
              ) : null}
            </ul>
            {destinations.length ? (
              <div className="flex flex-wrap gap-2">
                {destinations.map((destination) => (
                  <Chip key={destination.id} href={`/diem-den/${destination.slug}`}>
                    {destination.name}
                  </Chip>
                ))}
              </div>
            ) : null}
          </header>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <BookingCard
              tour={tour}
              bookingHref={settings.bookingPath || '/lien-he'}
              contact={toContactSettings(settings)}
            />
          </div>

          <div className="space-y-12 pb-4 lg:col-start-1">
            <RenderBlocks blocks={tour.layout} locale={locale} variant="stack" />
          </div>
        </div>
      </Container>

      {related.length ? (
        <section className="py-12 lg:py-16">
          <Container className="space-y-6">
            <SectionHeader title={t('relatedTours')} />
            <Carousel label={t('relatedTours')}>
              {related.map((relatedTour) => (
                <TourCard key={relatedTour.id} tour={relatedTour} />
              ))}
            </Carousel>
          </Container>
        </section>
      ) : null}
    </>
  )
}
