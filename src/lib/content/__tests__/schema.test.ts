import { describe, expect, it } from 'vitest'
import { imageAssetSchema, videoAssetSchema, tourSchema } from '../schema'

const validImage = {
  src: '/media/tours/mau-ha-giang/deo-ma-pi-leng.avif',
  alt: { vi: 'Đèo Mã Pí Lèng nhìn từ trên cao' },
  width: 2400,
  height: 1600,
  blurDataURL: 'data:image/webp;base64,UklGRg==',
}

describe('imageAssetSchema', () => {
  it('chấp nhận ảnh có đủ trường', () => {
    expect(() => imageAssetSchema.parse(validImage)).not.toThrow()
  })

  it('chấp nhận URL tuyệt đối để sau này chuyển sang Blob/R2 không phải sửa code', () => {
    expect(() =>
      imageAssetSchema.parse({ ...validImage, src: 'https://cdn.example.com/a.avif' }),
    ).not.toThrow()
  })

  it('từ chối src không phải đường dẫn tuyệt đối hay URL', () => {
    expect(() => imageAssetSchema.parse({ ...validImage, src: 'a.avif' })).toThrow()
  })

  it('từ chối alt rỗng vì ảnh không có alt là lỗi accessibility', () => {
    expect(() => imageAssetSchema.parse({ ...validImage, alt: { vi: '' } })).toThrow()
  })

  it('từ chối blurDataURL không phải data URL', () => {
    expect(() => imageAssetSchema.parse({ ...validImage, blurDataURL: 'abc' })).toThrow()
  })
})

const validVideo = {
  kind: 'video' as const,
  mp4: '/media/video/hero.mp4',
  webm: '/media/video/hero.webm',
  poster: validImage,
  durationSec: 5,
  scrubbable: true,
}

describe('videoAssetSchema', () => {
  it('chấp nhận video scrub dài 5 giây', () => {
    expect(() => videoAssetSchema.parse(validVideo)).not.toThrow()
  })

  it('từ chối video scrub dài quá 6 giây vì keyframe dày làm file phồng', () => {
    expect(() => videoAssetSchema.parse({ ...validVideo, durationSec: 8 })).toThrow()
  })

  it('cho phép video không scrub dài hơn 6 giây', () => {
    expect(() =>
      videoAssetSchema.parse({ ...validVideo, scrubbable: false, durationSec: 20 }),
    ).not.toThrow()
  })
})

const validTour = {
  slug: 'mau-ha-giang',
  title: { vi: 'Hà Giang mùa hoa tam giác mạch' },
  tagline: { vi: 'Bốn ngày trên cung đường đá' },
  summary: { vi: 'Hành trình qua Quản Bạ, Yên Minh, Đồng Văn và Mèo Vạc.' },
  durationDays: 4,
  priceFrom: 6900000,
  currency: 'VND' as const,
  destinations: ['Quản Bạ', 'Yên Minh', 'Đồng Văn', 'Mèo Vạc'],
  heroMedia: validImage,
  gallery: [validImage],
  // Số ngày phải khớp durationDays: 4 — schema có refine kiểm tra điều này,
  // nên fixture "hợp lệ" bắt buộc có đủ 4 ngày.
  itinerary: [
    { day: 1, title: { vi: 'Hà Nội – Quản Bạ' }, description: { vi: 'Khởi hành sớm.' } },
    { day: 2, title: { vi: 'Quản Bạ – Đồng Văn' }, description: { vi: 'Qua Yên Minh.' } },
    { day: 3, title: { vi: 'Đồng Văn – Mèo Vạc' }, description: { vi: 'Vượt Mã Pí Lèng.' } },
    { day: 4, title: { vi: 'Mèo Vạc – Hà Nội' }, description: { vi: 'Về xuôi.' } },
  ],
  inclusions: [{ vi: 'Xe đưa đón' }],
  exclusions: [{ vi: 'Chi phí cá nhân' }],
  seo: {
    title: 'Tour Hà Giang 4 ngày',
    description: 'Cung đường đá Hà Giang qua bốn huyện vùng cao.',
    ogImage: validImage,
  },
}

describe('tourSchema', () => {
  it('chấp nhận tour hợp lệ', () => {
    expect(() => tourSchema.parse(validTour)).not.toThrow()
  })

  it('từ chối slug có chữ hoa hoặc dấu để URL luôn sạch', () => {
    expect(() => tourSchema.parse({ ...validTour, slug: 'Hà-Giang' })).toThrow()
  })

  it('từ chối tour không có ngày nào trong lịch trình', () => {
    expect(() => tourSchema.parse({ ...validTour, itinerary: [] })).toThrow()
  })

  it('từ chối số ngày lịch trình không khớp durationDays', () => {
    expect(() => tourSchema.parse({ ...validTour, durationDays: 7 })).toThrow()
  })

  it('từ chối giá âm hoặc bằng không', () => {
    expect(() => tourSchema.parse({ ...validTour, priceFrom: 0 })).toThrow()
  })
})
