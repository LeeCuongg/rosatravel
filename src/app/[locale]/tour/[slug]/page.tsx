import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getTour, getTourSlugs } from '@/lib/content'
import { TourHero } from '@/components/tour/TourHero'
import { ItineraryCinematic } from '@/components/tour/ItineraryCinematic'
import { Gallery } from '@/components/tour/Gallery'
import { InclusionList } from '@/components/tour/InclusionList'
import { TourCta } from '@/components/tour/TourCta'
import { Reveal } from '@/components/motion/Reveal'
import { routing, type Locale } from '@/i18n/routing'

type Params = Promise<{ locale: Locale; slug: string }>

export async function generateStaticParams() {
  const slugs = await getTourSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const tour = await getTour(slug)
  if (!tour) return {}

  const title = tour.seo.title[locale] ?? tour.seo.title.vi
  const description = tour.seo.description[locale] ?? tour.seo.description.vi

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: tour.seo.ogImage.src, width: 1200, height: 630 }],
      type: 'article',
    },
  }
}

export default async function TourPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const tour = await getTour(slug)
  if (!tour) notFound()

  return (
    <main>
      <TourHero tour={tour} locale={locale} />
      <section className="mx-auto max-w-3xl px-6 py-(--spacing-section)">
        <Reveal>
          <p className="text-xl leading-relaxed">{tour.summary[locale] ?? tour.summary.vi}</p>
        </Reveal>
      </section>
      <ItineraryCinematic days={tour.itinerary} locale={locale} />
      <Gallery images={tour.gallery} locale={locale} />
      <InclusionList inclusions={tour.inclusions} exclusions={tour.exclusions} locale={locale} />
      <TourCta slug={tour.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            name: tour.title[locale] ?? tour.title.vi,
            description: tour.summary[locale] ?? tour.summary.vi,
            touristType: 'Leisure',
            itinerary: tour.itinerary.map((day) => ({
              '@type': 'Place',
              name: day.title[locale] ?? day.title.vi,
            })),
            offers: {
              '@type': 'Offer',
              price: tour.priceFrom,
              priceCurrency: tour.currency,
            },
          }),
        }}
      />
    </main>
  )
}
