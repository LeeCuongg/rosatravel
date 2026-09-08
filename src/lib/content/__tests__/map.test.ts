import { describe, expect, it } from 'vitest'
import { mapMedia, mapOgImage, mapTour, mapHome } from '../map'
import { imageAssetSchema, tourSchema, homeContentSchema } from '../schema'

const mediaDoc = {
  id: 'm1',
  url: 'https://blob.example.com/anh-w2400.avif',
  width: 2400,
  height: 1350,
  alt: { vi: 'Đèo Mã Pí Lèng nhìn từ trên cao' },
  blurDataURL: 'data:image/webp;base64,UklGRg==',
  // Biến thể og mà collection Media sinh sẵn — JPEG 1200×630 cắt sẵn, tên
  // riêng không theo quy ước "-<width>.<ext>" vì không đi qua loader.
  sizes: {
    og: {
      url: 'https://blob.example.com/anh-og.jpg',
      width: 1200,
      height: 630,
    },
  },
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

  it('ném lỗi khi quan hệ chỉ còn lại id', () => {
    // Payload trả về id trần trong hai trường hợp không phân biệt được: ảnh đã
    // bị xoá, hoặc truy vấn thiếu depth. Thông báo phải nêu CẢ HAI.
    expect(() => mapMedia('m1')).toThrow(/m1/)
  })

  it('thông báo nêu cả hai nguyên nhân: bản ghi đã xoá và thiếu depth', () => {
    // Ca thật hay gặp là nhân viên xoá một ảnh mà tour còn dùng. Bản cũ chỉ nói
    // "tăng depth khi truy vấn Payload" — vừa sai nguyên nhân, vừa là việc
    // người biên tập không thể làm. Test này giữ cho thông báo không rơi lại
    // về một nửa sự thật đó.
    let thongDiep = ''
    try {
      mapMedia('m1')
    } catch (error) {
      thongDiep = error instanceof Error ? error.message : String(error)
    }
    expect(thongDiep).toMatch(/xoá/i)
    expect(thongDiep).toMatch(/\/admin/)
    expect(thongDiep).toMatch(/depth/i)
  })
})

describe('mapOgImage', () => {
  it('lấy URL và kích thước từ sizes.og, không phải bản gốc', () => {
    // Bản gốc (mediaDoc.url/width/height) là 2400x1350 — nếu mapOgImage lỡ đọc
    // nhầm trường gốc thay vì sizes.og, thẻ chia sẻ mạng xã hội sẽ hiện ảnh sai
    // tỉ lệ. sizes.og luôn đúng 1200x630, cắt sẵn cho Facebook/Zalo.
    const result = imageAssetSchema.parse(mapOgImage(mediaDoc))
    expect(result.src).toBe('https://blob.example.com/anh-og.jpg')
    expect(result.width).toBe(1200)
    expect(result.height).toBe(630)
  })

  it('ném lỗi nói rõ id khi ảnh chưa có biến thể og', () => {
    const { sizes, ...thieuOg } = mediaDoc
    expect(() => mapOgImage(thieuOg)).toThrow(/m1/)
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
    { title: { vi: 'Ngày hai' }, description: { vi: 'Về xuôi.' }, images: [mediaDoc, mediaDoc] },
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

  it('trả mảng ảnh RỖNG cho ngày không có ảnh, không phải undefined', () => {
    // Khác hợp đồng cũ (media?: ImageAsset): giờ `images` luôn là mảng. Nhờ vậy
    // component gọi thẳng .map() được, không phải kiểm tồn tại ở mỗi chỗ dùng.
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.itinerary[0].images).toEqual([])
    expect(result.itinerary[1].images).toHaveLength(2)
  })

  it('trả mảng địa điểm RỖNG cho ngày không gắn địa điểm nào', () => {
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.itinerary[0].locations).toEqual([])
  })

  it('bỏ nhãn khối địa điểm khi người nhập để trống', () => {
    // Payload lưu group để trống thành { vi: '' }, và object đó truthy — kiểm
    // bằng `d.locationsLabel ? ...` sẽ để nó lọt qua rồi vỡ ở localizedTextSchema.
    const doc = {
      ...tourDoc,
      itinerary: [
        { title: { vi: 'Ngày một' }, description: { vi: 'Đi.' }, locationsLabel: { vi: '' } },
        { title: { vi: 'Ngày hai' }, description: { vi: 'Về.' }, locationsLabel: { vi: 'Ăn ở đâu' } },
      ],
    }
    const result = tourSchema.parse(mapTour(doc))
    expect(result.itinerary[0].locationsLabel).toBeUndefined()
    expect(result.itinerary[1].locationsLabel).toEqual({ vi: 'Ăn ở đâu' })
  })

  it('để zod bắt khi số ngày lịch trình không khớp durationDays', () => {
    const sai = { ...tourDoc, durationDays: 5 }
    expect(() => tourSchema.parse(mapTour(sai))).toThrow()
  })

  it('bỏ notes khi người nhập xoá hết nội dung — Payload lưu thành { vi: "" }', () => {
    // Đây là lý do coNoiDung tồn tại: { vi: '' } là truthy, nên kiểm tra
    // `t.notes ? ...` sẽ để nó lọt qua rồi vỡ ở localizedTextSchema.min(1).
    const result = tourSchema.parse(mapTour({ ...tourDoc, notes: { vi: '' } }))
    expect(result.notes).toBeUndefined()
  })

  it('giữ notes khi có nội dung thật', () => {
    const result = tourSchema.parse(mapTour({ ...tourDoc, notes: { vi: 'Mang theo áo ấm.' } }))
    expect(result.notes).toEqual({ vi: 'Mang theo áo ấm.' })
  })

  it('lấy seo.ogImage từ biến thể og 1200×630, không phải ảnh gốc', () => {
    // Đây là chỗ GĐ1 từng để lọt lỗi: dùng mapMedia (URL gốc) cho seo.ogImage
    // khiến thẻ chia sẻ mạng xã hội hiện ảnh sai tỉ lệ. mapOgImage sửa việc đó.
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.seo.ogImage.src).toBe('https://blob.example.com/anh-og.jpg')
    expect(result.seo.ogImage.width).toBe(1200)
    expect(result.seo.ogImage.height).toBe(630)
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

  it('chuyển quan hệ tour trong cảm nhận thành slug', () => {
    const withTestimonial = {
      ...homeDoc,
      testimonials: [{ name: 'Chị Lan', quote: { vi: 'Chuyến đi rất đáng nhớ.' }, tour: { id: 't1' } }],
    }
    const result = homeContentSchema.parse(mapHome(withTestimonial, slugById))
    expect(result.testimonials[0].tourSlug).toBe('mau-ha-giang')
  })

  it('ném lỗi nêu id khi quan hệ tour trong cảm nhận chưa được nạp hoặc mồ côi', () => {
    const withOrphan = {
      ...homeDoc,
      testimonials: [{ name: 'Chị Lan', quote: { vi: 'Rất đáng nhớ.' }, tour: 'id-khong-ton-tai' }],
    }
    expect(() => mapHome(withOrphan, slugById)).toThrow(/id-khong-ton-tai/)
  })
})
