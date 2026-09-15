import type { Where } from 'payload'

import { firstParam } from './url'

/*
 * Bộ lọc danh sách tour đọc từ URL (?diem-di=&so-ngay=&gia=&thang=&sap-xep=&trang=).
 * Mọi giá trị lạ đều bị bỏ qua, không bao giờ đưa thẳng vào truy vấn.
 */

export const DURATION_OPTIONS = {
  '1-2': { min: 1, max: 2 },
  '3-4': { min: 3, max: 4 },
  '5-7': { min: 5, max: 7 },
  '8+': { min: 8, max: null },
} as const

export const PRICE_OPTIONS = {
  'duoi-5tr': { min: null, max: 5_000_000 },
  '5-10tr': { min: 5_000_000, max: 10_000_000 },
  '10-20tr': { min: 10_000_000, max: 20_000_000 },
  'tren-20tr': { min: 20_000_000, max: null },
} as const

export const SORT_OPTIONS = {
  'moi-nhat': '-updatedAt',
  'gia-tang': 'price',
  'gia-giam': '-price',
  'ngan-ngay': 'durationDays',
} as const

export type DurationKey = keyof typeof DURATION_OPTIONS
export type PriceKey = keyof typeof PRICE_OPTIONS
export type SortKey = keyof typeof SORT_OPTIONS

export type TourFilters = {
  from: string | null
  duration: DurationKey | null
  price: PriceKey | null
  /** YYYY-MM */
  month: string | null
  sort: SortKey
  page: number
}

type SearchParams = Record<string, string | string[] | undefined>

function isKey<T extends object>(options: T, value: string | undefined): value is Extract<keyof T, string> {
  return value !== undefined && Object.hasOwn(options, value)
}

export function parseTourFilters(params: SearchParams): TourFilters {
  const from = firstParam(params['diem-di'])?.trim()
  const duration = firstParam(params['so-ngay'])
  const price = firstParam(params.gia)
  const month = firstParam(params.thang)
  const sort = firstParam(params['sap-xep'])
  const page = Number.parseInt(firstParam(params.trang) ?? '1', 10)

  return {
    from: from && from.length <= 80 ? from : null,
    duration: isKey(DURATION_OPTIONS, duration) ? duration : null,
    price: isKey(PRICE_OPTIONS, price) ? price : null,
    month: month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null,
    sort: isKey(SORT_OPTIONS, sort) ? sort : 'moi-nhat',
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 1000) : 1,
  }
}

export function tourFilterWhere(filters: TourFilters): Where[] {
  const where: Where[] = []

  if (filters.from) {
    where.push({ departureFrom: { equals: filters.from } })
  }
  if (filters.duration) {
    const { min, max } = DURATION_OPTIONS[filters.duration]
    where.push({ durationDays: { greater_than_equal: min } })
    if (max !== null) where.push({ durationDays: { less_than_equal: max } })
  }
  if (filters.price) {
    const { min, max } = PRICE_OPTIONS[filters.price]
    if (min !== null) where.push({ price: { greater_than_equal: min } })
    if (max !== null) where.push({ price: { less_than: max } })
  }
  if (filters.month) {
    // `departureMonths` tự tính khi lưu tour: lọc theo đúng một ngày khởi hành trong tháng,
    // không bị khớp nhầm như khi đặt hai điều kiện rời trên mảng lịch khởi hành.
    where.push({ departureMonths: { equals: filters.month } })
  }

  return where
}

/** Tham số URL của bộ lọc (bỏ giá trị mặc định) để dựng link. */
export function toFilterQuery(
  filters: TourFilters,
  overrides: Partial<TourFilters> = {},
): Record<string, string | number | null> {
  const merged = { ...filters, ...overrides }
  return {
    'diem-di': merged.from,
    'so-ngay': merged.duration,
    gia: merged.price,
    thang: merged.month,
    'sap-xep': merged.sort === 'moi-nhat' ? null : merged.sort,
    trang: merged.page > 1 ? merged.page : null,
  }
}

/** Các tháng (YYYY-MM) có ngày khởi hành. Ngày "chỉ ngày" lưu 12:00 UTC nên tháng UTC trùng tháng giờ Việt Nam. */
export function departureMonthsOf(departures: { date?: string | null }[] | null | undefined): string[] {
  const months = (departures ?? [])
    .map((departure) => (departure?.date ? new Date(departure.date) : null))
    .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()))
    .map((date) => date.toISOString().slice(0, 7))
  return [...new Set(months)].sort()
}

/** `count` tháng liên tiếp tính từ tháng hiện tại, dạng YYYY-MM. */
export function upcomingMonths(now: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1)).toISOString().slice(0, 7),
  )
}
