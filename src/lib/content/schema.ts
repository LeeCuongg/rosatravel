import { z } from 'zod'

/**
 * Mọi văn bản hướng người đọc đều bọc theo locale ngay từ đầu.
 * Thêm tiếng Anh sau này là thêm khoá `en`, không phải migration.
 */
export const localizedTextSchema = z.object({
  vi: z.string().min(1, 'Nội dung tiếng Việt không được rỗng'),
  en: z.string().min(1).optional(),
})

/** Cho phép cả đường dẫn nội bộ (/media/...) lẫn URL tuyệt đối (Blob, R2). */
const mediaSrcSchema = z
  .string()
  .refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), {
    message: 'src phải là đường dẫn tuyệt đối bắt đầu bằng / hoặc URL http(s)',
  })

export const imageAssetSchema = z.object({
  src: mediaSrcSchema,
  alt: localizedTextSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataURL: z.string().startsWith('data:image/'),
  /**
   * Chú thích in dưới ảnh. KHÁC `alt` và không thay thế được cho nhau: `alt`
   * mô tả ảnh cho người không nhìn thấy nó ("con đường vắt ngang sườn núi"),
   * còn `caption` nói thêm điều mà người NHÌN THẤY ảnh vẫn không biết ("chụp
   * lúc 5h sáng, trước khi sương tan"). Trình đọc màn hình đọc cả hai, nên
   * chép alt sang caption là bắt người dùng nghe hai lần cùng một câu.
   */
  caption: localizedTextSchema.optional(),
  /**
   * Nguồn ảnh — "© Tên tác giả / Hãng". Không bọc locale: tên riêng và ký hiệu
   * bản quyền không dịch.
   *
   * Nằm ở bản ghi ẢNH chứ không ở chỗ dùng ảnh, vì bản quyền thuộc về bức ảnh
   * chứ không thuộc về trang đăng nó. Cùng một ảnh mượn xuất hiện ở ba bài thì
   * cả ba đều phải ghi nguồn, và ghi ở ba nơi là ba cơ hội để quên một chỗ.
   */
  credit: z.string().min(1).optional(),
})

// CHƯA CÓ DỮ LIỆU NÀO ĐI QUA ĐÂY: collection `media` của Payload chỉ sinh ra
// ảnh, nên videoAssetSchema (và isVideoAsset ở './guards') hiện luôn nhận
// nhánh false. Giữ nguyên có chủ đích — pipeline video là Task 12, chưa làm.
export const videoAssetSchema = z
  .object({
    kind: z.literal('video'),
    mp4: mediaSrcSchema,
    webm: mediaSrcSchema,
    poster: imageAssetSchema,
    durationSec: z.number().positive(),
    scrubbable: z.boolean(),
  })
  .refine((v) => !v.scrubbable || v.durationSec <= 6, {
    message: 'Video scrub phải ngắn hơn hoặc bằng 6 giây (keyframe dày làm file phồng nhanh)',
    path: ['durationSec'],
  })

export const mediaAssetSchema = z.union([imageAssetSchema, videoAssetSchema])

/**
 * Nhóm SEO — giống hệt nhau ở tour, địa điểm và chuyến đã đi, nên khai một lần.
 * Cả ba trường đều hiện ra trước mắt người đọc (tab trình duyệt, kết quả tìm
 * kiếm, thẻ chia sẻ) nên đều bọc locale.
 */
export const seoSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  ogImage: imageAssetSchema,
})

/**
 * ĐỊA ĐIỂM — một nơi có thật, tồn tại độc lập với mọi chuyến đi.
 *
 * `body` là mảng đoạn văn thuần chứ không phải cây rich text: xem giải thích ở
 * `doanVanArray` trong src/collections/fields.ts.
 */
export const locationSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug chỉ gồm chữ thường, số và dấu gạch ngang'),
  name: localizedTextSchema,
  category: z.enum(['an-uong', 'luu-tru', 'thien-nhien', 'van-hoa', 'cho-mua-sam']),
  excerpt: localizedTextSchema,
  body: z.array(localizedTextSchema).min(1),
  /**
   * Tên thành phố/vùng hiện trên THẺ địa điểm, ngắn gọn ("Hà Giang", "New
   * York"). Không thay thế `address`: địa chỉ là dòng dài để người ta tìm
   * đường tới, còn cái này là một nhãn để phân biệt hai quán trùng tên ở hai
   * vùng khi lướt qua danh sách. Site một vùng thì bỏ trống được.
   */
  city: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  website: z.url().optional(),
  images: z.array(imageAssetSchema).min(1),
  seo: seoSchema,
})

export const itineraryDaySchema = z.object({
  day: z.number().int().positive(),
  title: localizedTextSchema,
  description: localizedTextSchema,
  /**
   * ĐỔI Ở GĐ3: trước đây là `media?: ImageAsset` (một ảnh). Giờ là mảng, để
   * bố cục ngày dựng được dải ảnh hai cột. Mảng RỖNG là hợp lệ — ngày không
   * có ảnh vẫn là một ngày hợp lệ.
   */
  images: z.array(imageAssetSchema),
  /** Nhãn của khối địa điểm ("Ăn ở đâu"). Bỏ trống thì dùng nhãn mặc định. */
  locationsLabel: localizedTextSchema.optional(),
  locations: z.array(locationSchema),
})

export const tourSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug chỉ gồm chữ thường, số và dấu gạch ngang'),
    title: localizedTextSchema,
    tagline: localizedTextSchema,
    summary: localizedTextSchema,
    durationDays: z.number().int().positive(),
    priceFrom: z.number().positive(),
    currency: z.literal('VND'),
    // Tên điểm đến hiển thị cho người đọc nên cũng bọc locale: bản tiếng Anh
    // thường bỏ dấu ("Quan Ba") cho khách quốc tế dễ tra cứu.
    destinations: z.array(localizedTextSchema).min(1),
    heroMedia: mediaAssetSchema,
    gallery: z.array(imageAssetSchema).min(1),
    itinerary: z.array(itineraryDaySchema).min(1),
    inclusions: z.array(localizedTextSchema).min(1),
    exclusions: z.array(localizedTextSchema),
    notes: localizedTextSchema.optional(),
    seo: seoSchema,
  })
  .refine((t) => t.itinerary.length === t.durationDays, {
    message: 'Số ngày trong lịch trình phải khớp durationDays',
    path: ['itinerary'],
  })

/**
 * Một mục Câu hỏi thường gặp. Số thứ tự KHÔNG nằm ở đây — nó được suy ra từ vị
 * trí trong mảng lúc hiển thị, để người nhập kéo thả sắp lại thứ tự mà không
 * phải đánh số lại bằng tay.
 */
export const faqItemSchema = z.object({
  question: localizedTextSchema,
  answer: localizedTextSchema,
})

/**
 * Người dẫn đường — khối tự giới thiệu đặt dưới biểu mẫu liên hệ.
 *
 * `name` là chuỗi trần, không bọc locale: tên riêng của một người không dịch.
 * `role` và `bio` thì có ("Người sáng lập" / "Founder").
 */
export const guideSchema = z.object({
  name: z.string().min(1),
  role: localizedTextSchema,
  bio: localizedTextSchema,
  photo: imageAssetSchema.optional(),
})

/**
 * CHUYẾN ĐÃ ĐI — một chuyến có thật đã tổ chức xong, kể lại theo ngày.
 *
 * Khác Tour ở chỗ KHÔNG có giá và KHÔNG có `durationDays`. Số ngày ở đây suy
 * ra từ độ dài mảng `days`, và cố tình không có ràng buộc "phải khớp" như bên
 * tour: bài viết được phép gộp hai ngày nhạt vào một mục, hoặc bỏ hẳn ngày
 * cuối chỉ ngồi sân bay. Nó là bài viết, không phải bảng lịch trình.
 */
export const caseDaySchema = z.object({
  day: z.number().int().positive(),
  title: localizedTextSchema,
  body: z.array(localizedTextSchema).min(1),
  images: z.array(imageAssetSchema),
  /**
   * Ảnh xếp thành DẢI trên đầu ngày (`dai`), hay XEN vào giữa các đoạn văn
   * (`xen`).
   *
   * `xen` là nhịp của bài phóng sự: đoạn — ảnh — đoạn — ảnh, người đọc dừng
   * mắt đúng chỗ câu chữ vừa nhắc tới. `dai` là nhịp của bài có kèm album:
   * xem hết ảnh rồi mới đọc. Cả hai đều dùng được, nhưng chúng đọc ra khác
   * nhau và phải là lựa chọn của người viết chứ không phải mặc định của
   * component.
   *
   * VỊ TRÍ xen là tự động, chia đều theo số đoạn — người viết chọn KIỂU, không
   * chọn từng chỗ. Đó là giới hạn có ý thức: điều khiển từng vị trí đòi một
   * trình soạn thảo khối, và cái giá của nó (di trú dữ liệu, ánh xạ cây JSON
   * không cố định hình dạng) lớn hơn nhiều so với thứ nó mang lại ở đây.
   */
  imageLayout: z.enum(['dai', 'xen']).default('dai'),
  locationsLabel: localizedTextSchema.optional(),
  locations: z.array(locationSchema),
})

export const caseStudySchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug chỉ gồm chữ thường, số và dấu gạch ngang'),
  title: localizedTextSchema,
  subtitle: localizedTextSchema,
  /** Phải khớp danh sách MAU_NHAN trong src/collections/CaseStudies.ts. */
  accent: z.enum(['dat-nung', 'xanh-reu', 'chi-lam', 'tim-man', 'vang-dat']),
  heroImage: imageAssetSchema,
  /** Ảnh thẻ ở trang chủ. Ánh xạ rơi về heroImage khi người nhập bỏ trống. */
  thumbnail: imageAssetSchema,
  highlights: z.array(localizedTextSchema).min(1),
  ourRole: z.array(localizedTextSchema).min(1),
  days: z.array(caseDaySchema).min(1),
  /**
   * Chỗ ở gợi ý — khối RIÊNG, đặt sau tất cả các ngày.
   *
   * Vì sao không nhét vào `locations` của một ngày như trước: chỗ ở không
   * thuộc về một ngày cụ thể. Một khách sạn ở suốt bốn đêm mà bị gắn vào ngày
   * 2 thì người đọc lướt tới ngày 5 sẽ tưởng đoàn đã chuyển chỗ. Và đây là thứ
   * khách hỏi nhiều nhất — chôn nó giữa bài là bắt họ đọc lại từ đầu để tìm.
   *
   * Mặc định rỗng: bài kể về một chuyến trong ngày thì không có gì để gợi ý.
   */
  accommodations: z.array(locationSchema).default([]),
  /** Nhãn của khối chỗ ở. Bỏ trống thì dùng nhãn mặc định. */
  accommodationsLabel: localizedTextSchema.optional(),
  seo: seoSchema,
})

export const testimonialSchema = z.object({
  name: z.string().min(1),
  quote: localizedTextSchema,
  tourSlug: z.string().optional(),
  avatar: imageAssetSchema.optional(),
})

export const homeContentSchema = z.object({
  hero: z.object({
    headline: localizedTextSchema,
    subline: localizedTextSchema,
    media: mediaAssetSchema,
  }),
  whyUs: z
    .array(z.object({ title: localizedTextSchema, body: localizedTextSchema }))
    .min(1),
  featuredTourSlugs: z.array(z.string()).min(1),
  journey: z.object({
    headline: localizedTextSchema,
    stops: z
      .array(z.object({ label: localizedTextSchema, image: imageAssetSchema }))
      .min(2),
  }),
  testimonials: z.array(testimonialSchema),
  /**
   * Hai khối dưới đây thêm ở GĐ3 và đều KHÔNG bắt buộc. Đó là quyết định có
   * chủ đích: bản ghi `home` đang chạy ngoài production được nhập từ trước khi
   * hai trường này tồn tại. Để chúng bắt buộc thì lần build kế tiếp sẽ vỡ ở
   * parseOrThrow với một thông báo về "dữ liệu CMS không hợp lệ", trong khi
   * thật ra chẳng ai làm sai gì cả.
   *
   * Component tương ứng (Faq, Guide) tự ẩn khi rỗng, nên trang vẫn hoàn chỉnh
   * trong lúc chờ người nhập bổ sung.
   */
  faq: z.array(faqItemSchema).default([]),
  guide: guideSchema.optional(),
  contact: z.object({
    phone: z.string().min(1),
    zaloUrl: z.url(),
    email: z.email(),
  }),
})

export type LocalizedText = z.infer<typeof localizedTextSchema>
export type ImageAsset = z.infer<typeof imageAssetSchema>
export type VideoAsset = z.infer<typeof videoAssetSchema>
export type MediaAsset = z.infer<typeof mediaAssetSchema>
export type ItineraryDay = z.infer<typeof itineraryDaySchema>
export type Testimonial = z.infer<typeof testimonialSchema>
export type FaqItem = z.infer<typeof faqItemSchema>
export type Guide = z.infer<typeof guideSchema>
export type Tour = z.infer<typeof tourSchema>
export type Location = z.infer<typeof locationSchema>
export type CaseDay = z.infer<typeof caseDaySchema>
export type CaseStudy = z.infer<typeof caseStudySchema>
export type Accent = CaseStudy['accent']
export type HomeContent = z.infer<typeof homeContentSchema>

// isVideoAsset sống ở './guards' (không phải ở đây) vì nó là giá trị runtime
// duy nhất mà component client cần từ content layer. Tách riêng để module đó
// không kéo theo bất cứ import nào khác của schema.ts vào bundle trình duyệt.
