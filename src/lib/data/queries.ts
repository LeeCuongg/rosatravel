import { draftMode } from 'next/headers'
import type { TypedLocale, Where } from 'payload'

import { tags } from '@/lib/cache-tags'
import { getPayloadClient } from '@/lib/payload'
import { searchFragments } from '@/lib/search'
import { SORT_OPTIONS, tourFilterWhere, type TourFilters } from '@/lib/tour-filters'
import type { Post, Tour, TourCarouselBlock } from '@/payload-types'
import type { TourSummary } from '@/types/content'

import { cached } from './cache'
import { toTourSummaries } from './mappers'

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

/* ---------- Slug cho generateStaticParams (chạy lúc build, không cache) ---------- */

type SluggedCollection = 'tours' | 'tour-categories' | 'destinations' | 'posts' | 'pages'

export async function getSlugs(collection: SluggedCollection): Promise<string[]> {
  const hasDrafts = collection !== 'tour-categories'
  const { docs } = await (await getPayloadClient()).find({
    collection,
    where: hasDrafts ? { _status: { equals: 'published' } } : {},
    depth: 0,
    limit: 1000,
    pagination: false,
  })
  return docs.map((doc) => (doc as { slug?: string | null }).slug).filter((slug): slug is string => Boolean(slug))
}

export const getPublishedTourSlugs = () => getSlugs('tours')

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

type TourScope = { categoryId?: string; destinationId?: string }

function scopeWhere({ categoryId, destinationId }: TourScope): Where[] {
  return [
    ...(categoryId ? [{ categories: { in: [categoryId] } }] : []),
    ...(destinationId ? [{ destinations: { in: [destinationId] } }] : []),
  ]
}

export type ToursPage = {
  tours: TourSummary[]
  totalDocs: number
  totalPages: number
  page: number
}

export const TOURS_PER_PAGE = 12

export function getToursPage(scope: TourScope, filters: TourFilters, locale: string): Promise<ToursPage> {
  return cached(
    {
      key: ['tours-page', scope.categoryId ?? '', scope.destinationId ?? '', JSON.stringify(filters), locale],
      tags: [tags.tours],
      revalidate: 3600,
    },
    async (draft) => {
      const result = await (await getPayloadClient()).find({
        collection: 'tours',
        where: all([...scopeWhere(scope), ...tourFilterWhere(filters), ...publishedOnly(draft)]),
        sort: SORT_OPTIONS[filters.sort],
        page: filters.page,
        limit: TOURS_PER_PAGE,
        depth: 1,
        locale: asLocale(locale),
        draft,
      })
      return {
        tours: toTourSummaries(result.docs, draft),
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? filters.page,
      }
    },
  )
}

/** Các điểm khởi hành có trong phạm vi (danh mục / điểm đến) để làm lựa chọn lọc. */
export function getDepartureCities(scope: TourScope, locale: string): Promise<string[]> {
  return cached(
    { key: ['departure-cities', scope.categoryId ?? '', scope.destinationId ?? '', locale], tags: [tags.tours] },
    async (draft) => {
      const { docs } = await (await getPayloadClient()).find({
        collection: 'tours',
        where: all([...scopeWhere(scope), ...publishedOnly(draft)]),
        depth: 0,
        limit: 500,
        pagination: false,
        locale: asLocale(locale),
        draft,
      })
      const cities = new Set(docs.map((doc) => doc.departureFrom?.trim()).filter(Boolean))
      return [...cities].sort((a, b) => a.localeCompare(b, 'vi'))
    },
  )
}

/* ---------- Tìm kiếm ---------- */

export const SEARCH_PER_PAGE = 12

/** Tìm tour theo từ khóa đã chuẩn hóa (không dấu). Tour phải chứa đủ mọi từ. */
export function searchTours(
  query: string,
  options: { page?: number; limit?: number },
  locale: string,
): Promise<ToursPage> {
  const page = options.page ?? 1
  const limit = options.limit ?? SEARCH_PER_PAGE
  return cached(
    { key: ['search', query, String(page), String(limit), locale], tags: [tags.tours], revalidate: 3600 },
    async (draft) => {
      const result = await (await getPayloadClient()).find({
        collection: 'tours',
        // Mỗi từ phải khớp từ đầu một từ trong tên/mô tả (xem searchFragments).
        where: all([
          ...searchFragments(query).map((fragment): Where => ({ searchText: { contains: fragment } })),
          ...publishedOnly(draft),
        ]),
        sort: '-updatedAt',
        page,
        limit,
        depth: 1,
        locale: asLocale(locale),
        draft,
      })
      return {
        tours: toTourSummaries(result.docs, draft),
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? page,
      }
    },
  )
}

/* ---------- Danh mục, điểm đến, trang tĩnh ---------- */

export function getCategoryBySlug(slug: string, locale: string) {
  return cached({ key: ['category', slug, locale], tags: [tags.categories, tags.category(slug)] }, async () => {
    const { docs } = await (await getPayloadClient()).find({
      collection: 'tour-categories',
      where: { slug: { equals: slug } },
      locale: asLocale(locale),
      depth: 1,
      limit: 1,
      pagination: false,
    })
    return docs[0] ?? null
  })
}

export function getDestinationBySlug(slug: string, locale: string) {
  return cached(
    { key: ['destination', slug, locale], tags: [tags.destinations, tags.destination(slug)] },
    async (draft) => {
      const { docs } = await (await getPayloadClient()).find({
        collection: 'destinations',
        where: all([{ slug: { equals: slug } }, ...publishedOnly(draft)]),
        locale: asLocale(locale),
        depth: 1,
        limit: 1,
        pagination: false,
        draft,
      })
      return docs[0] ?? null
    },
  )
}

export function getPageBySlug(slug: string, locale: string) {
  return cached(
    // Trang tĩnh có thể chứa khối băng chuyền tour nên cũng làm mới theo tag tours.
    { key: ['page', slug, locale], tags: [tags.pages, tags.page(slug), tags.tours] },
    async (draft) => {
      const { docs } = await (await getPayloadClient()).find({
        collection: 'pages',
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

/* ---------- Bài viết ---------- */

export function getPostBySlug(slug: string, locale: string) {
  return cached({ key: ['post', slug, locale], tags: [tags.posts, tags.post(slug)] }, async (draft) => {
    const { docs } = await (await getPayloadClient()).find({
      collection: 'posts',
      where: all([{ slug: { equals: slug } }, ...publishedOnly(draft)]),
      locale: asLocale(locale),
      depth: 1,
      limit: 1,
      pagination: false,
      draft,
    })
    return docs[0] ?? null
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

export const POSTS_PER_PAGE = 12

export function getPostsPage(options: { category?: Post['category'] | null; page: number }, locale: string) {
  const { category, page } = options
  return cached(
    { key: ['posts-page', category ?? 'all', String(page), locale], tags: [tags.posts] },
    async (draft) => {
      const result = await (await getPayloadClient()).find({
        collection: 'posts',
        where: all([...(category ? [{ category: { equals: category } }] : []), ...publishedOnly(draft)]),
        locale: asLocale(locale),
        sort: '-publishedAt',
        depth: 1,
        page,
        limit: POSTS_PER_PAGE,
        draft,
      })
      return { posts: result.docs, totalPages: result.totalPages, page: result.page ?? page }
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
