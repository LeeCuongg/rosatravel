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
 * Payload trả về id dạng chuỗi thay vì document khi truy vấn không đủ `depth`.
 * Phân biệt hai trường hợp này quan trọng: một cái là lỗi truy vấn của lập
 * trình viên, cái kia là lỗi dữ liệu của người nhập, và cách sửa khác hẳn nhau.
 */
function phaiLaDocument(value: unknown, ten: string): Record<string, unknown> {
  if (typeof value === 'string' || typeof value === 'number') {
    loi(`Quan hệ "${ten}" chưa được nạp — tăng depth khi truy vấn Payload`, value)
  }
  if (!value || typeof value !== 'object') {
    loi(`Quan hệ "${ten}" rỗng hoặc sai kiểu`)
  }
  return value as Record<string, unknown>
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
      ogImage: mapMedia((t.seo as Record<string, unknown>)?.ogImage),
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
    featuredTourSlugs: ((h.featuredTours as unknown[] | undefined) ?? []).map((ref) => {
      const id = typeof ref === 'object' && ref !== null ? (ref as { id: unknown }).id : ref
      const slug = tourSlugById.get(String(id))
      if (!slug) {
        loi('Tour nổi bật trỏ tới một tour không còn tồn tại — bỏ nó khỏi trang chủ', id)
      }
      return slug
    }),
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
        ...(t.tour ? { tourSlug: tourSlugById.get(String((t.tour as { id: unknown }).id)) } : {}),
        ...(t.avatar ? { avatar: mapMedia(t.avatar) } : {}),
      }
    }),
    contact: h.contact,
  }
}
