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
})

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

export const itineraryDaySchema = z.object({
  day: z.number().int().positive(),
  title: localizedTextSchema,
  description: localizedTextSchema,
  media: imageAssetSchema.optional(),
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
    // seo.title và seo.description hiện trên tab trình duyệt, kết quả tìm kiếm
    // và thẻ chia sẻ mạng xã hội — hướng người đọc, nên bọc locale như mọi
    // trường văn bản khác.
    seo: z.object({
      title: localizedTextSchema,
      description: localizedTextSchema,
      ogImage: imageAssetSchema,
    }),
  })
  .refine((t) => t.itinerary.length === t.durationDays, {
    message: 'Số ngày trong lịch trình phải khớp durationDays',
    path: ['itinerary'],
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
export type Tour = z.infer<typeof tourSchema>
export type HomeContent = z.infer<typeof homeContentSchema>

// isVideoAsset sống ở './guards' (không phải ở đây) vì nó là giá trị runtime
// duy nhất mà component client cần từ content layer. Tách riêng để module đó
// không kéo theo bất cứ import nào khác của schema.ts vào bundle trình duyệt.
