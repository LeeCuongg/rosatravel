import { X } from 'lucide-react'
import NextLink from 'next/link'
import { getFormatter, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { TourCard } from '@/components/tour/TourCard'
import { Button, buttonClassName } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { getPathname } from '@/i18n/navigation'
import type { ToursPage } from '@/lib/data/queries'
import {
  DURATION_OPTIONS,
  PRICE_OPTIONS,
  SORT_OPTIONS,
  toFilterQuery,
  upcomingMonths,
  type TourFilters,
} from '@/lib/tour-filters'
import { withQuery } from '@/lib/url'

type TourListingProps = {
  /** Đường dẫn trang (chưa có tiền tố ngôn ngữ), vd. /danh-muc/tour-mua-thu */
  basePath: string
  locale: string
  filters: TourFilters
  result: ToursPage
  cities: string[]
  bookingHref: string
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-caption font-semibold text-body">
      <span>{label}</span>
      {children}
    </label>
  )
}

/**
 * Danh sách tour có bộ lọc. Form dùng GET nên chạy được cả khi chưa tải JavaScript,
 * và mỗi bộ lọc là một URL chia sẻ được.
 */
export async function TourListing({ basePath, locale, filters, result, cities, bookingHref }: TourListingProps) {
  const [t, format] = await Promise.all([getTranslations('Listing'), getFormatter()])
  const action = getPathname({ href: basePath, locale })

  const monthLabel = (value: string) => {
    const [year, month] = value.split('-').map(Number)
    return format.dateTime(new Date(Date.UTC(year, month - 1, 15)), { month: 'long', year: 'numeric' })
  }
  const months = upcomingMonths(new Date(), 12)
  if (filters.month && !months.includes(filters.month)) months.unshift(filters.month)

  const activeFilters: { label: string; clear: Partial<TourFilters> }[] = []
  if (filters.from) activeFilters.push({ label: filters.from, clear: { from: null } })
  if (filters.duration) activeFilters.push({ label: t(`durationOptions.${filters.duration}`), clear: { duration: null } })
  if (filters.price) activeFilters.push({ label: t(`priceOptions.${filters.price}`), clear: { price: null } })
  if (filters.month) activeFilters.push({ label: monthLabel(filters.month), clear: { month: null } })

  const hrefFor = (overrides: Partial<TourFilters>) => withQuery(action, toFilterQuery(filters, overrides))

  return (
    <div className="space-y-8">
      <form
        action={action}
        method="get"
        className="grid gap-4 rounded-md bg-canvas-soft p-4 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end lg:p-5"
      >
        <Field label={t('from')}>
          <Select name="diem-di" defaultValue={filters.from ?? ''}>
            <option value="">{t('any')}</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('duration')}>
          <Select name="so-ngay" defaultValue={filters.duration ?? ''}>
            <option value="">{t('any')}</option>
            {Object.keys(DURATION_OPTIONS).map((key) => (
              <option key={key} value={key}>
                {t(`durationOptions.${key}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('price')}>
          <Select name="gia" defaultValue={filters.price ?? ''}>
            <option value="">{t('any')}</option>
            {Object.keys(PRICE_OPTIONS).map((key) => (
              <option key={key} value={key}>
                {t(`priceOptions.${key}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('month')}>
          <Select name="thang" defaultValue={filters.month ?? ''}>
            <option value="">{t('any')}</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {monthLabel(month)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('sort')}>
          <Select name="sap-xep" defaultValue={filters.sort}>
            {Object.keys(SORT_OPTIONS).map((key) => (
              <option key={key} value={key}>
                {t(`sortOptions.${key}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" className="w-full lg:w-auto">
          {t('apply')}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 text-body-sm font-semibold text-ink" aria-live="polite">
          {t('results', { count: result.totalDocs })}
        </p>
        {activeFilters.map((filter) => (
          <NextLink
            key={filter.label}
            href={hrefFor({ ...filter.clear, page: 1 })}
            aria-label={t('removeFilter', { label: filter.label })}
            className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-ink px-3 text-body-sm font-medium text-on-primary transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {filter.label}
            <X aria-hidden className="size-4" />
          </NextLink>
        ))}
        {activeFilters.length ? (
          <NextLink href={action} className="text-body-sm font-semibold text-ink underline underline-offset-4 hover:text-primary">
            {t('reset')}
          </NextLink>
        ) : null}
      </div>

      {result.tours.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.tours.map((tour, index) => (
            <li key={tour.id}>
              <TourCard tour={tour} preload={index < 2} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-md bg-canvas-soft p-8">
          <p className="text-body-md text-ink">{t('empty')}</p>
          <div className="flex flex-wrap gap-3">
            {activeFilters.length ? (
              <NextLink href={action} className={buttonClassName({ variant: 'tertiary' })}>
                {t('reset')}
              </NextLink>
            ) : null}
            <NextLink href={getPathname({ href: bookingHref, locale })} className={buttonClassName()}>
              {t('askConsultant')}
            </NextLink>
          </div>
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(page) => hrefFor({ page })} />
    </div>
  )
}
