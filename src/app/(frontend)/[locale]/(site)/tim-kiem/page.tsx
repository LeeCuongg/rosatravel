import type { Metadata } from 'next'
import NextLink from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SearchBar } from '@/components/search/SearchBar'
import { TourCard } from '@/components/tour/TourCard'
import { buttonClassName } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Pagination } from '@/components/ui/Pagination'
import { getPathname } from '@/i18n/navigation'
import { getSiteSettings, searchTours } from '@/lib/data/queries'
import { SEARCH_MAX_LENGTH, toSearchQuery } from '@/lib/search'
import { firstParam, withQuery } from '@/lib/url'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQuery(value: string | string[] | undefined) {
  return (firstParam(value) ?? '').trim().slice(0, SEARCH_MAX_LENGTH)
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const t = await getTranslations({ locale, namespace: 'Search' })
  const raw = readQuery(query.q)
  return {
    title: raw ? t('resultsTitle', { query: raw }) : t('title'),
    // Trang kết quả tìm kiếm không cần lên Google.
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  setRequestLocale(locale)

  const raw = readQuery(query.q)
  const normalized = toSearchQuery(raw)
  const page = Math.max(1, Math.min(1000, Number.parseInt(firstParam(query.trang) ?? '1', 10) || 1))

  const [t, tListing, settings, result] = await Promise.all([
    getTranslations('Search'),
    getTranslations('Listing'),
    getSiteSettings(locale),
    normalized ? searchTours(normalized, { page }, locale) : Promise.resolve(null),
  ])
  const basePath = getPathname({ href: '/tim-kiem', locale })

  return (
    <>
      <section className="bg-canvas-soft">
        <Container className="space-y-5 py-10 lg:py-14">
          <h1 className="font-display text-display-sub-sm font-semibold text-balance text-ink md:text-display-md">
            {raw ? t('resultsTitle', { query: raw }) : t('title')}
          </h1>
          <SearchBar defaultValue={raw} className="max-w-2xl" />
        </Container>
      </section>

      <Container className="space-y-8 py-10 lg:py-14">
        {!result ? (
          <p className="text-body-md text-body">{t('hint')}</p>
        ) : result.totalDocs ? (
          <>
            <p className="text-body-sm font-semibold text-ink" aria-live="polite">
              {tListing('results', { count: result.totalDocs })}
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.tours.map((tour) => (
                <li key={tour.id}>
                  <TourCard tour={tour} />
                </li>
              ))}
            </ul>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              hrefFor={(target) => withQuery(basePath, { q: raw, trang: target > 1 ? target : null })}
            />
          </>
        ) : (
          <div className="flex flex-col items-start gap-4 rounded-md bg-canvas-soft p-8">
            <p className="text-body-md text-ink">{t('noResults', { query: raw })}</p>
            <NextLink href={getPathname({ href: settings.bookingPath || '/lien-he', locale })} className={buttonClassName()}>
              {tListing('askConsultant')}
            </NextLink>
          </div>
        )}
      </Container>
    </>
  )
}
