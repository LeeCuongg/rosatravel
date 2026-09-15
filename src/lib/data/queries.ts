import { draftMode } from 'next/headers'
import type { TypedLocale, Where } from 'payload'

import { tags } from '@/lib/cache-tags'
import { getPayloadClient } from '@/lib/payload'
import type { Post, TourCarouselBlock } from '@/payload-types'
import type { TourSummary } from '@/types/content'

import { cached } from './cache'
import { toTourSummaries } from './mappers'
import type { Tour } from '@/payload-types'

const asLocale = (locale: string) => locale as TypedLocale

/** Collection có drafts: khi không xem nháp chỉ lấy bản đã xuất bản (Local API bỏ qua quyền truy cập). */
function publishedOnly(draft: boolean): Where[] {
  return draft ? [] : [{ _status: { equals: 'published' } }]
}

function all(conditions: Where[]): Where {
  return conditions.length ? { and: conditions } : {}
}

/* ---------- Globals ---------- */

export function getSiteSettings(locale: string) {
  return cached({ key: ['site-settings', locale], tags: [tags.global('site-settings')] }, async (draft) =>
    (await getPayloadClient()).findGlobal({ slug: 'site-settings', locale: asLocale(locale), depth: 0, draft }),
  )
}

export function getHeader(locale: string) {
  return cached({ key: ['header', locale], tags: [tags.global('header'), tags.tours] }, async (draft) =>
    (await getPayloadClient()).findGlobal({ slug: 'header', locale: asLocale(locale), depth: 2, draft }),
  )
}

export function getFooter(locale: string) {
  return cached({ key: ['footer', locale], tags: [tags.global('footer')] }, async (draft) =>
    (await getPayloadClient()).findGlobal({ slug: 'footer', locale: asLocale(locale), depth: 0, draft }),
  )
}

export function getHome(locale: string) {
  return cached(
    {
      key: ['home', locale],
      tags: [tags.global('home'), tags.tours, tags.destinations, tags.categories],
    },
    async (draft) => (await getPayloadClient()).findGlobal({ slug: 'home', locale: asLocale(locale), depth: 2, draft }),
  )
}

/* ---------- Tour ---------- */

export function getTourBySlug(slug: string, locale: string) {
  return cached(
    // revalidate 1 giờ để ngày khởi hành đã qua tự ẩn dù không ai xuất bản lại.
    { key: ['tour', slug, locale], tags: [tags.tours, tags.tour(slug)], revalidate: 3600 },
    async (draft) => {
      const { docs } = await (await getPayloadClient()).find({
        collection: 'tours',
        where: all([{ slug: { equals: slug } }, ...publishedOnly(draft)]),
        locale: asLocale(locale),
        depth: 2,
        limit: 1,
        pagination: false,
        draft,
      })
      return docs[0] ?? null
    },
  )
}

/** Dùng cho generateStaticParams, chạy lúc build nên không cần cache. */
export async function getPublishedTourSlugs(): Promise<string[]> {
  const { docs } = await (await getPayloadClient()).find({
    collection: 'tours',
    where: { _status: { equals: 'published' } },
    select: { slug: true },
    depth: 0,
    limit: 1000,
    pagination: false,
  })
  return docs.map((doc) => doc.slug).filter(Boolean)
}

/** Tour liên quan do nhân viên chọn; để trống thì gợi ý tour cùng điểm đến. */
export function getRelatedTours(tour: Tour, locale: string): Promise<TourSummary[]> {
  return cached({ key: ['related', tour.id, locale], tags: [tags.tours], revalidate: 3600 }, async (draft) => {
    const chosen = toTourSummaries(tour.relatedTours, draft)
    if (chosen.length) return chosen

    const destinationIds = (tour.destinations ?? []).map((d) => (typeof d === 'string' ? d : d.id))
    if (!destinationIds.length) return []

    const { docs } = await (await getPayloadClient()).find({
      collection: 'tours',
      where: all([
        { destinations: { in: destinationIds } },
        { id: { not_equals: tour.id } },
        ...publishedOnly(draft),
      ]),
      locale: asLocale(locale),
      depth: 1,
      limit: 8,
      sort: '-updatedAt',
      draft,
    })
    return toTourSummaries(docs, draft)
  })
}

export async function getCarouselTours(block: TourCarouselBlock, locale: string): Promise<TourSummary[]> {
  if (block.source === 'manual') {
    // Tour đã được populate cùng trang chứa khối; chỉ cần lọc bản nháp.
    const { isEnabled } = await draftMode()
    return toTourSummaries(block.tours, isEnabled)
  }

  const categoryId = typeof block.category === 'string' ? block.category : block.category?.id
  const condition: Where | null =
    block.source === 'category'
      ? categoryId
        ? { categories: { in: [categoryId] } }
        : null
      : block.source === 'featured'
        ? { isFeatured: { equals: true } }
        : { isTrending: { equals: true } }

  if (!condition) return []

  const limit = block.limit ?? 8
  return cached(
    { key: ['carousel', block.source, categoryId ?? '', String(limit), locale], tags: [tags.tours], revalidate: 3600 },
    async (draft) => {
      const { docs } = await (await getPayloadClient()).find({
        collection: 'tours',
        where: all([condition, ...publishedOnly(draft)]),
        locale: asLocale(locale),
        depth: 1,
        limit,
        sort: '-updatedAt',
        draft,
      })
      return toTourSummaries(docs, draft)
    },
  )
}

/* ---------- Nội dung khác ---------- */

export function getActiveBanners(placement: 'hero' | 'promo', locale: string) {
  // Cache 10 phút để banner tự hiện / tự ẩn theo ngày đã đặt.
  return cached({ key: ['banners', placement, locale], tags: [tags.banners], revalidate: 600 }, async () => {
    const now = new Date().toISOString()
    const { docs } = await (await getPayloadClient()).find({
      collection: 'banners',
      where: {
        and: [
          { placement: { equals: placement } },
          { active: { equals: true } },
          { or: [{ startsAt: { exists: false } }, { startsAt: { equals: null } }, { startsAt: { less_than_equal: now } }] },
          { or: [{ endsAt: { exists: false } }, { endsAt: { equals: null } }, { endsAt: { greater_than: now } }] },
        ],
      },
      locale: asLocale(locale),
      sort: 'order',
      depth: 1,
      limit: 10,
    })
    return docs
  })
}

export function getApprovedReviews(limit: number, locale: string) {
  return cached({ key: ['reviews', String(limit), locale], tags: [tags.reviews] }, async () => {
    const { docs } = await (await getPayloadClient()).find({
      collection: 'reviews',
      where: { approved: { equals: true } },
      locale: asLocale(locale),
      sort: '-updatedAt',
      depth: 1,
      limit,
    })
    return docs
  })
}

export function getClients(locale: string) {
  return cached({ key: ['clients', locale], tags: [tags.clients] }, async () => {
    const { docs } = await (await getPayloadClient()).find({
      collection: 'clients',
      locale: asLocale(locale),
      sort: 'order',
      depth: 1,
      limit: 30,
    })
    return docs
  })
}

export function getPosts(options: { category?: Post['category'] | null; limit: number }, locale: string) {
  const { category, limit } = options
  return cached({ key: ['posts', category ?? 'all', String(limit), locale], tags: [tags.posts] }, async (draft) => {
    const { docs } = await (await getPayloadClient()).find({
      collection: 'posts',
      where: all([...(category ? [{ category: { equals: category } }] : []), ...publishedOnly(draft)]),
      locale: asLocale(locale),
      sort: '-publishedAt',
      depth: 1,
      limit,
      draft,
    })
    return docs
  })
}
