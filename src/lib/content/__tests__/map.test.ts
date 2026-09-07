import { describe, expect, it } from 'vitest'
import { mapMedia, mapTour, mapHome } from '../map'
import { imageAssetSchema, tourSchema, homeContentSchema } from '../schema'

const mediaDoc = {
  id: 'm1',
  url: 'https://blob.example.com/anh-w2400.avif',
  width: 2400,
  height: 1350,
  alt: { vi: 'Đèo Mã Pí Lèng nhìn từ trên cao' },
  blurDataURL: 'data:image/webp;base64,UklGRg==',
}

describe('mapMedia', () => {
  it('dựng ImageAsset mà schema chấp nhận', () => {
    expect(() => imageAssetSchema.parse(mapMedia(mediaDoc))).not.toThrow()
  })

  it('giữ nguyên alt bọc locale, không làm phẳng thành chuỗi', () => {
    const result = imageAssetSchema.parse(mapMedia(mediaDoc))
    expect(result.alt).toEqual({ vi: 'Đèo Mã Pí Lèng nhìn từ trên cao' })
  })

  it('ném lỗi nói rõ id khi thiếu blurDataURL', () => {
    // Hook ở Task 2 điền trường này. Nếu nó vắng mặt thì hook hỏng, và thông báo
    // phải chỉ đúng bản ghi để người sửa tìm được nó trong admin.
    const { blurDataURL, ...thieu } = mediaDoc
    expect(() => mapMedia(thieu)).toThrow(/m1/)
  })

  it('ném lỗi khi quan hệ chưa được nạp (chỉ còn id dạng chuỗi)', () => {
    // Payload trả về id thay vì document khi depth không đủ. Đây là lỗi truy vấn,
    // không phải lỗi dữ liệu, và thông báo phải nói đúng điều đó.
    expect(() => mapMedia('m1')).toThrow(/chưa được nạp|depth/i)
  })
})

const tourDoc = {
  id: 't1',
  slug: 'mau-ha-giang',
  title: { vi: 'Hà Giang mùa hoa tam giác mạch' },
  tagline: { vi: 'Bốn ngày trên cung đường đá' },
  summary: { vi: 'Hành trình qua bốn huyện vùng cao.' },
  durationDays: 2,
  priceFrom: 6900000,
  destinations: [{ vi: 'Quản Bạ' }, { vi: 'Đồng Văn' }],
  heroMedia: mediaDoc,
  gallery: [mediaDoc],
  itinerary: [
    { title: { vi: 'Ngày một' }, description: { vi: 'Khởi hành sớm.' } },
    { title: { vi: 'Ngày hai' }, description: { vi: 'Về xuôi.' }, media: mediaDoc },
  ],
  inclusions: [{ vi: 'Xe đưa đón' }],
  exclusions: [{ vi: 'Chi phí cá nhân' }],
  seo: {
    title: { vi: 'Tour Hà Giang' },
    description: { vi: 'Cung đường đá Hà Giang.' },
    ogImage: mediaDoc,
  },
}

describe('mapTour', () => {
  it('dựng Tour mà schema chấp nhận', () => {
    expect(() => tourSchema.parse(mapTour(tourDoc))).not.toThrow()
  })

  it('gán cứng currency VND vì người nhập không được hỏi về nó', () => {
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.currency).toBe('VND')
  })

  it('đánh số ngày lịch trình từ 1 theo thứ tự mảng', () => {
    // Payload không lưu số ngày; thứ tự trong mảng LÀ số ngày. Người nhập kéo
    // thả để sắp lại, và số phải đi theo thứ tự mới chứ không dính vào bản ghi.
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.itinerary.map((d) => d.day)).toEqual([1, 2])
  })

  it('bỏ trường media của ngày khi không có ảnh', () => {
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.itinerary[0].media).toBeUndefined()
    expect(result.itinerary[1].media).toBeDefined()
  })

  it('để zod bắt khi số ngày lịch trình không khớp durationDays', () => {
    const sai = { ...tourDoc, durationDays: 5 }
    expect(() => tourSchema.parse(mapTour(sai))).toThrow()
  })
})

describe('mapHome', () => {
  const slugById = new Map([['t1', 'mau-ha-giang']])
  const homeDoc = {
    hero: { headline: { vi: 'Những cung đường' }, subline: { vi: 'Nhóm nhỏ.' }, media: mediaDoc },
    whyUs: [{ title: { vi: 'Nhóm nhỏ' }, body: { vi: 'Tối đa 12 khách.' } }],
    featuredTours: [{ id: 't1' }],
    journey: {
      headline: { vi: 'Hành trình đi qua' },
      stops: [
        { label: { vi: 'Quản Bạ' }, image: mediaDoc },
        { label: { vi: 'Đồng Văn' }, image: mediaDoc },
      ],
    },
    testimonials: [],
    contact: { phone: '0900000000', zaloUrl: 'https://zalo.me/0900000000', email: 'a@b.com' },
  }

  it('dựng HomeContent mà schema chấp nhận', () => {
    expect(() => homeContentSchema.parse(mapHome(homeDoc, slugById))).not.toThrow()
  })

  it('chuyển quan hệ tour thành mảng slug', () => {
    // Payload lưu quan hệ để người nhập chọn từ danh sách; schema nội bộ dùng
    // slug. Chuyển đổi này là lý do tầng adapter tồn tại.
    const result = homeContentSchema.parse(mapHome(homeDoc, slugById))
    expect(result.featuredTourSlugs).toEqual(['mau-ha-giang'])
  })

  it('ném lỗi nói rõ id khi quan hệ trỏ tới tour không còn tồn tại', () => {
    const moCoi = { ...homeDoc, featuredTours: [{ id: 'khong-ton-tai' }] }
    expect(() => mapHome(moCoi, slugById)).toThrow(/khong-ton-tai/)
  })
})
