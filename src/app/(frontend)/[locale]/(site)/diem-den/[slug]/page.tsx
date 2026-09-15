import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PageHero } from '@/components/layout/PageHero'
import { RichText } from '@/components/rich-text/RichText'
import { TourListing } from '@/components/tour/TourListing'
import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { toImage } from '@/lib/data/mappers'
import { getDepartureCities, getDestinationBySlug, getSiteSettings, getToursPage } from '@/lib/data/queries'
import { parseTourFilters } from '@/lib/tour-filters'

type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const destination = await getDestinationBySlug(slug, locale)
  if (!destination) return {}

  const image = toImage(destination.seo?.image, 'hero') ?? toImage(destination.coverImage, 'hero')
  return {
    title: destination.seo?.title || destination.name,
    description: destination.seo?.description || destination.summary || undefined,
    openGraph: image ? { images: [{ url: image.url, alt: image.alt }] } : undefined,
    alternates: { canonical: `/diem-den/${slug}` },
  }
}

export default async function DestinationPage({ params, searchParams }: Props) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams])
  setRequestLocale(locale)

  const destination = await getDestinationBySlug(slug, locale)
  if (!destination) notFound()

  const filters = parseTourFilters(query)
  const scope = { destinationId: destination.id }
  const [result, cities, settings, t] = await Promise.all([
    getToursPage(scope, filters, locale),
    getDepartureCities(scope, locale),
    getSiteSettings(locale),
    getTranslations('Destination'),
  ])

  return (
    <>
      <PageHero
        title={destination.name}
        description={destination.summary}
        image={toImage(destination.coverImage, 'hero')}
      />
      {destination.description ? (
        <Container className="max-w-3xl pt-10 lg:pt-14">
          <RichText data={destination.description} />
        </Container>
      ) : null}
      <Container className="space-y-6 py-10 lg:py-14">
        <SectionHeader title={t('tours', { name: destination.name })} />
        <TourListing
          basePath={`/diem-den/${slug}`}
          locale={locale}
          filters={filters}
          result={result}
          cities={cities}
          bookingHref={settings.bookingPath || '/lien-he'}
        />
      </Container>
    </>
  )
}
