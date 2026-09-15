import type { Footer, Header, Media, SiteSetting, Tour } from '@/payload-types'
import type { ContactSettings, FooterColumn, ImageAsset, NavItem, TourSummary } from '@/types/content'

export type MediaSize = 'thumbnail' | 'card' | 'hero'

/** Quan hệ Payload là id (chưa populate) hoặc object (đã populate). */
export function isPopulated<T extends object>(value: string | T | null | undefined): value is T {
  return typeof value === 'object' && value !== null
}

export function toImage(value: string | Media | null | undefined, size?: MediaSize): ImageAsset | null {
  if (!isPopulated(value)) return null
  const variant = size ? value.sizes?.[size] : undefined
  const useVariant = Boolean(variant?.url)
  const url = useVariant ? variant?.url : value.url
  if (!url) return null
  return {
    url,
    alt: value.alt ?? '',
    width: (useVariant ? variant?.width : value.width) ?? null,
    height: (useVariant ? variant?.height : value.height) ?? null,
  }
}

type WithStatus = { _status?: 'draft' | 'published' | null }

/**
 * Tài liệu đã populate và khách được thấy. Local API bỏ qua quyền truy cập nên
 * bản nháp có thể lọt vào qua quan hệ (vd. tour chọn trong menu); khi không xem
 * nháp thì loại chúng ra.
 */
export function visible<T extends object & WithStatus>(
  docs: (string | T | null | undefined)[] | null | undefined,
  draft: boolean,
): T[] {
  return (docs ?? [])
    .filter((doc): doc is T => isPopulated(doc))
    .filter((doc) => draft || doc._status == null || doc._status === 'published')
}

export function toTourSummary(tour: Tour): TourSummary | null {
  const coverImage = toImage(tour.coverImage, 'card')
  if (!coverImage || !tour.slug) return null

  const { ratingAverage, ratingCount, bookedCount } = tour.stats ?? {}

  return {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    coverImage,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    departureFrom: tour.departureFrom,
    price: tour.price,
    originalPrice: tour.originalPrice ?? null,
    rating: ratingAverage && ratingCount ? { average: ratingAverage, count: ratingCount } : null,
    bookedCount: bookedCount ?? null,
    badges: tour.badges?.map((badge) => badge.text).filter(Boolean) ?? null,
  }
}

export function toTourSummaries(tours: (string | Tour | null | undefined)[] | null | undefined, draft: boolean): TourSummary[] {
  return visible(tours, draft)
    .map(toTourSummary)
    .filter((tour): tour is TourSummary => tour !== null)
}

export function toNavItems(header: Header, draft = false): NavItem[] {
  return (header.navItems ?? []).map((item) => {
    const groups =
      item.megaMenu?.groups?.map((group) => ({
        title: group.title,
        href: group.href ?? null,
        links: (group.links ?? []).map((link) => ({ label: link.label, href: link.href })),
      })) ?? []
    const featuredTours = toTourSummaries(item.megaMenu?.featuredTours, draft)

    return {
      label: item.label,
      href: item.href,
      highlight: item.highlight ?? false,
      megaMenu: item.hasMegaMenu && (groups.length || featuredTours.length) ? { groups, featuredTours } : null,
    }
  })
}

export function toContactSettings(settings: SiteSetting): ContactSettings {
  return {
    hotline: settings.hotline,
    email: settings.email,
    zalo: settings.zalo,
    messenger: settings.messenger,
    facebook: settings.facebook,
    instagram: settings.instagram,
    threads: settings.threads,
  }
}

export function toFooterColumns(footer: Footer): FooterColumn[] {
  return (footer.columns ?? []).map((column) => ({
    title: column.title,
    links: (column.links ?? []).map((link) => ({ label: link.label, href: link.href })),
  }))
}

export type Departure = NonNullable<Tour['departures']>[number]

/** Ngày khởi hành từ hôm nay trở đi, sớm nhất trước. */
export function upcomingDepartures(departures: Tour['departures'], now = new Date()): Departure[] {
  // Ngày dạng "chỉ ngày" được lưu lúc 12:00 UTC; lùi 1 ngày để vẫn giữ ngày hôm nay.
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000
  return (departures ?? [])
    .filter((departure) => new Date(departure.date).getTime() >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
