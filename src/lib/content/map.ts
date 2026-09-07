import type { ImageAsset } from './schema'

/**
 * Trường văn bản bọc locale có được coi là "có nội dung" không.
 *
 * Payload lưu group để trống thành `{ vi: '' }`, và object đó truthy — nên mọi
 * kiểm tra kiểu `x ? ... : ...` đều để nó lọt qua rồi vỡ ở zod. Đây là lỗi
 * Task 3 phát hiện khi nhập thử tour đầu tiên.
 */
function coNoiDung(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const vi = (value as { vi?: unknown }).vi
  return typeof vi === 'string' && vi.trim().length > 0
}

/** Ném lỗi kèm ngữ cảnh đủ để tìm ra bản ghi trong admin. */
function loi(thongDiep: string, id?: unknown): never {
  throw new Error(id ? `${thongDiep} (bản ghi: ${String(id)})` : thongDiep)
}

/**
 * Payload trả về id trần thay vì document trong HAI trường hợp, và từ đây
 * KHÔNG phân biệt được chúng — giá trị nhận về giống hệt nhau:
 *
 *  1. Bản ghi được trỏ tới đã bị xoá. Xem
 *     node_modules/payload/dist/fields/hooks/afterRead/relationshipPopulationPromise.js
 *     (~dòng 47): tra không ra document thì Payload gán ngược `relationshipValue = id`.
 *     Đây là trường hợp xảy ra thật ngoài đời — nhân viên xoá một ảnh trong
 *     Thư viện ảnh mà một tour còn dùng làm ảnh bìa.
 *  2. Truy vấn thiếu `depth`. Đây là lỗi lập trình, chỉ xuất hiện khi ai đó
 *     sửa cms.ts.
 *
 * Thông báo phải nói cả hai, và phải đặt nguyên nhân (1) lên trước: người đọc
 * nó gần như luôn là người vừa xoá nhầm một ảnh, không phải lập trình viên.
 */
function phaiLaDocument(value: unknown, ten: string): Record<string, unknown> {
  if (typeof value === 'string' || typeof value === 'number') {
    loi(
      `Quan hệ "${ten}" chỉ còn lại id — hoặc bản ghi được trỏ tới đã bị xoá ` +
        `(vào /admin, gắn lại bản ghi khác hoặc bỏ liên kết này), hoặc truy vấn thiếu depth — lỗi lập trình`,
      value,
    )
  }
  if (!value || typeof value !== 'object') {
    loi(`Quan hệ "${ten}" rỗng hoặc sai kiểu`)
  }
  return value as Record<string, unknown>
}

/**
 * Lấy slug của một tour từ giá trị quan hệ, dù Payload trả về cả document hay
 * chỉ id. Ném lỗi nêu id khi không tra được — quan hệ mồ côi phải ồn ào, không
 * được biến mất trong im lặng.
 */
function slugCuaTour(ref: unknown, tourSlugById: Map<string, string>, nguCanh: string, goiY: string): string {
  const id = typeof ref === 'object' && ref !== null ? (ref as { id: unknown }).id : ref
  const slug = tourSlugById.get(String(id))
  if (!slug) {
    loi(`${nguCanh} trỏ tới một tour không còn tồn tại — ${goiY}`, id)
  }
  return slug
}

export function mapMedia(doc: unknown): ImageAsset {
  const m = phaiLaDocument(doc, 'media')
  if (!m.blurDataURL) {
    loi('Ảnh thiếu blurDataURL — hook sinh ảnh mờ không chạy, thử tải lại ảnh', m.id)
  }
  return {
    src: String(m.url ?? loi('Ảnh không có url', m.id)),
    alt: m.alt as ImageAsset['alt'],
    width: Number(m.width),
    height: Number(m.height),
    blurDataURL: String(m.blurDataURL),
  }
}

/**
 * Ảnh chia sẻ mạng xã hội dùng biến thể `og` mà collection Media sinh sẵn:
 * JPEG 1200×630, cắt sẵn, không hậu tố kích thước.
 *
 * KHÔNG dùng mapMedia ở đây. mapMedia trả URL gốc để next/image gắn thêm biến
 * thể theo bề rộng — nhưng URL trong thẻ og: không bao giờ đi qua loader, và
 * Zalo lẫn Facebook không đọc được AVIF. Lấy nhầm bản gốc nghĩa là thẻ share
 * hiện ảnh sai tỉ lệ, hoặc không hiện gì.
 */
export function mapOgImage(doc: unknown): ImageAsset {
  const m = phaiLaDocument(doc, 'ảnh chia sẻ mạng xã hội')
  const og = (m.sizes as Record<string, Record<string, unknown>> | undefined)?.og
  if (!og?.url) {
    loi(
      'Ảnh chia sẻ mạng xã hội chưa có biến thể og — tải lại ảnh này trong /admin để sinh bản 1200×630',
      m.id,
    )
  }
  if (!m.blurDataURL) {
    loi('Ảnh thiếu blurDataURL — hook sinh ảnh mờ không chạy, thử tải lại ảnh', m.id)
  }
  return {
    src: String(og.url),
    alt: m.alt as ImageAsset['alt'],
    width: Number(og.width),
    height: Number(og.height),
    blurDataURL: String(m.blurDataURL),
  }
}

export function mapTour(doc: unknown): unknown {
  const t = phaiLaDocument(doc, 'tour')
  const itinerary = (t.itinerary as unknown[] | undefined) ?? []

  return {
    slug: t.slug,
    title: t.title,
    tagline: t.tagline,
    summary: t.summary,
    durationDays: t.durationDays,
    priceFrom: t.priceFrom,
    // Người nhập không được hỏi về đơn vị tiền — schema bắt buộc hằng VND.
    currency: 'VND',
    destinations: t.destinations,
    heroMedia: mapMedia(t.heroMedia),
    gallery: ((t.gallery as unknown[] | undefined) ?? []).map(mapMedia),
    itinerary: itinerary.map((ngay, index) => {
      const d = ngay as Record<string, unknown>
      return {
        // Thứ tự trong mảng LÀ số ngày. Người nhập kéo thả để sắp lại, và số
        // phải đi theo thứ tự mới chứ không dính cứng vào bản ghi.
        day: index + 1,
        title: d.title,
        description: d.description,
        ...(d.media ? { media: mapMedia(d.media) } : {}),
      }
    }),
    inclusions: t.inclusions,
    exclusions: (t.exclusions as unknown[] | undefined) ?? [],
    // Payload lưu trường group để trống thành { vi: '' } chứ không bỏ hẳn, và
    // { vi: '' } là truthy — kiểm bằng `t.notes ?` sẽ để nó lọt qua rồi vỡ ở
    // localizedTextSchema.min(1). Phải kiểm nội dung, không kiểm sự tồn tại.
    ...(coNoiDung(t.notes) ? { notes: t.notes } : {}),
    seo: {
      title: (t.seo as Record<string, unknown>)?.title,
      description: (t.seo as Record<string, unknown>)?.description,
      ogImage: mapOgImage((t.seo as Record<string, unknown>)?.ogImage),
    },
  }
}

export function mapHome(doc: unknown, tourSlugById: Map<string, string>): unknown {
  const h = phaiLaDocument(doc, 'home')
  const hero = h.hero as Record<string, unknown>
  const journey = h.journey as Record<string, unknown>

  return {
    hero: {
      headline: hero?.headline,
      subline: hero?.subline,
      media: mapMedia(hero?.media),
    },
    whyUs: h.whyUs,
    featuredTourSlugs: ((h.featuredTours as unknown[] | undefined) ?? []).map((ref) =>
      slugCuaTour(ref, tourSlugById, 'Tour nổi bật', 'bỏ nó khỏi trang chủ'),
    ),
    journey: {
      headline: journey?.headline,
      stops: ((journey?.stops as unknown[] | undefined) ?? []).map((s) => {
        const stop = s as Record<string, unknown>
        return { label: stop.label, image: mapMedia(stop.image) }
      }),
    },
    testimonials: ((h.testimonials as unknown[] | undefined) ?? []).map((x) => {
      const t = x as Record<string, unknown>
      return {
        name: t.name,
        quote: t.quote,
        ...(t.tour
          ? { tourSlug: slugCuaTour(t.tour, tourSlugById, 'Cảm nhận khách hàng', 'bỏ liên kết tour khỏi cảm nhận này') }
          : {}),
        ...(t.avatar ? { avatar: mapMedia(t.avatar) } : {}),
      }
    }),
    contact: h.contact,
  }
}
