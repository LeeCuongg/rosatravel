import { getPayload } from 'payload'
import config from '@payload-config'
import { cache } from 'react'
import { homeContentSchema, tourSchema, type HomeContent, type Tour } from './schema'
import { mapHome, mapTour } from './map'

/**
 * Cache theo từng request: layout.tsx và page.tsx đều gọi getHomeContent().
 * Không có cache thì mỗi trang truy vấn database hai lần cho cùng một dữ liệu.
 */
const getClient = cache(async () => {
  try {
    return await getPayload({ config })
  } catch (error) {
    throw new Error(
      'Không kết nối được MongoDB Atlas.\n' +
        'Kiểm tra: MONGODB_URI đúng chưa, mật khẩu còn hiệu lực không, và IP hiện tại đã nằm trong Network Access của Atlas chưa.\n' +
        'Build cần đọc database để sinh trang tĩnh, nên không có kết nối là không build được.\n' +
        `Lỗi gốc: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})

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

/**
 * depth 1 là đủ: mảng và group không tốn depth trong Payload, chỉ quan hệ mới
 * tốn — và mọi quan hệ mapTour/mapHome giải tham chiếu (heroMedia, gallery,
 * itinerary[].media, seo.ogImage, hero.media, journey.stops[].image,
 * testimonials[].avatar, testimonials[].tour) đều cách document gốc đúng một
 * bước. Bản thân document media không còn quan hệ nào để nạp tiếp.
 */
const DEPTH = 1

/**
 * Ranh giới cho một hãng lữ hành boutique, không phải một sàn giao dịch —
 * dư dả so với số tour thực tế. Nếu Payload báo còn trang tiếp theo, danh
 * sách đã bị cắt bớt âm thầm: dừng lại ồn ào thay vì trả về thiếu tour mà
 * không ai biết.
 */
const GIOI_HAN_TOUR = 1000

function baoNeuCatBot(hasNextPage: boolean, boSuuTap: string): void {
  if (hasNextPage) {
    throw new Error(
      `${boSuuTap} có nhiều hơn ${GIOI_HAN_TOUR} bản ghi — danh sách đã bị cắt bớt âm thầm. Tăng limit trong cms.ts hoặc thêm phân trang.`,
    )
  }
}

export const readTours = cache(async (): Promise<Tour[]> => {
  const payload = await getClient()
  const { docs, hasNextPage } = await payload.find({ collection: 'tours', depth: DEPTH, limit: GIOI_HAN_TOUR })
  baoNeuCatBot(hasNextPage, 'Danh sách tour')
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
  const { docs, hasNextPage } = await payload.find({
    collection: 'tours',
    depth: 0,
    limit: GIOI_HAN_TOUR,
    select: { slug: true },
  })
  baoNeuCatBot(hasNextPage, 'Danh sách slug tour')
  return docs.map((d) => String(d.slug))
})

export const readHomeContent = cache(async (): Promise<HomeContent> => {
  const payload = await getClient()
  const [home, tours] = await Promise.all([
    payload.findGlobal({ slug: 'home', depth: DEPTH }),
    payload.find({ collection: 'tours', depth: 0, limit: GIOI_HAN_TOUR, select: { slug: true } }),
  ])
  baoNeuCatBot(tours.hasNextPage, 'Danh sách slug tour (tra cứu tour nổi bật)')
  const slugById = new Map(tours.docs.map((d) => [String(d.id), String(d.slug)]))
  return parseOrThrow<HomeContent>(homeContentSchema, mapHome(home, slugById), 'nội dung trang chủ')
})
