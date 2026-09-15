import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { PageHero } from '@/components/layout/PageHero'
import { TourListing } from '@/components/tour/TourListing'
import { Container } from '@/components/ui/Container'
import { toImage } from '@/lib/data/mappers'
import { getCategoryBySlug, getDepartureCities, getSiteSettings, getToursPage } from '@/lib/data/queries'
import { parseTourFilters } from '@/lib/tour-filters'

type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const category = await getCategoryBySlug(slug, locale)
  if (!category) return {}

  const image = toImage(category.seo?.image, 'hero') ?? toImage(category.coverImage, 'hero')
  return {
    title: category.seo?.title || category.name,
    description: category.seo?.description || category.summary || undefined,
    openGraph: image ? { images: [{ url: image.url, alt: image.alt }] } : undefined,
    alternates: { canonical: `/danh-muc/${slug}` },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams])
  setRequestLocale(locale)

  const category = await getCategoryBySlug(slug, locale)
  if (!category) notFound()

  const filters = parseTourFilters(query)
  const scope = { categoryId: category.id }
  const [result, cities, settings] = await Promise.all([
    getToursPage(scope, filters, locale),
    getDepartureCities(scope, locale),
    getSiteSettings(locale),
  ])

  return (
    <>
      <PageHero title={category.name} description={category.summary} image={toImage(category.coverImage, 'hero')} />
      <Container className="py-10 lg:py-14">
        <TourListing
          basePath={`/danh-muc/${slug}`}
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
