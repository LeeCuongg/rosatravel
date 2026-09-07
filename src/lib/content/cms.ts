import { getPayload } from 'payload'
import config from '@payload-config'
import { cache } from 'react'
import { homeContentSchema, tourSchema, type HomeContent, type Tour } from './schema'
import { mapHome, mapTour } from './map'

/**
 * Cache theo từng request: layout.tsx và page.tsx đều gọi getHomeContent().
 * Không có cache thì mỗi trang truy vấn database hai lần cho cùng một dữ liệu.
 */
const getClient = cache(async () => getPayload({ config }))

function parseOrThrow<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } },
  data: unknown,
  nguon: string,
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Dữ liệu từ CMS không hợp lệ tại ${nguon}.\n` +
        'Mô hình trong Payload và schema zod đã lệch nhau — sửa bản ghi trong /admin hoặc sửa hàm ánh xạ.\n' +
        JSON.stringify(result.error, null, 2),
    )
  }
  return result.data as T
}

/** depth 2 để nạp cả ảnh nằm trong lịch trình và trong seo. */
const DEPTH = 2

export const readTours = cache(async (): Promise<Tour[]> => {
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'tours', depth: DEPTH, limit: 1000 })
  return docs.map((doc) => parseOrThrow<Tour>(tourSchema, mapTour(doc), `tour "${doc.slug}"`))
})

export const readTour = cache(async (slug: string): Promise<Tour | null> => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'tours',
    where: { slug: { equals: slug } },
    depth: DEPTH,
    limit: 1,
  })
  if (docs.length === 0) return null
  return parseOrThrow<Tour>(tourSchema, mapTour(docs[0]), `tour "${slug}"`)
})

export const readTourSlugs = cache(async (): Promise<string[]> => {
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'tours', depth: 0, limit: 1000, select: { slug: true } })
  return docs.map((d) => String(d.slug))
})

export const readHomeContent = cache(async (): Promise<HomeContent> => {
  const payload = await getClient()
  const [home, tours] = await Promise.all([
    payload.findGlobal({ slug: 'home', depth: DEPTH }),
    payload.find({ collection: 'tours', depth: 0, limit: 1000, select: { slug: true } }),
  ])
  const slugById = new Map(tours.docs.map((d) => [String(d.id), String(d.slug)]))
  return parseOrThrow<HomeContent>(homeContentSchema, mapHome(home, slugById), 'nội dung trang chủ')
})
