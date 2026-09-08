import { describe, expect, it } from 'vitest'
import { caseStudySchema, imageAssetSchema, locationSchema, videoAssetSchema, tourSchema } from '../schema'

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
  destinations: [{ vi: 'Quản Bạ' }, { vi: 'Yên Minh' }, { vi: 'Đồng Văn' }, { vi: 'Mèo Vạc' }],
  heroMedia: validImage,
  gallery: [validImage],
  // Số ngày phải khớp durationDays: 4 — schema có refine kiểm tra điều này,
  // nên fixture "hợp lệ" bắt buộc có đủ 4 ngày.
  // `images` và `locations` là mảng BẮT BUỘC (được phép rỗng) từ GĐ3 — bỏ
  // chúng đi thì zod từ chối cả tour, nên fixture phải khai đủ.
  itinerary: [
    { day: 1, title: { vi: 'Hà Nội – Quản Bạ' }, description: { vi: 'Khởi hành sớm.' }, images: [], locations: [] },
    { day: 2, title: { vi: 'Quản Bạ – Đồng Văn' }, description: { vi: 'Qua Yên Minh.' }, images: [], locations: [] },
    { day: 3, title: { vi: 'Đồng Văn – Mèo Vạc' }, description: { vi: 'Vượt Mã Pí Lèng.' }, images: [], locations: [] },
    { day: 4, title: { vi: 'Mèo Vạc – Hà Nội' }, description: { vi: 'Về xuôi.' }, images: [], locations: [] },
  ],
  inclusions: [{ vi: 'Xe đưa đón' }],
  exclusions: [{ vi: 'Chi phí cá nhân' }],
  seo: {
    title: { vi: 'Tour Hà Giang 4 ngày' },
    description: { vi: 'Cung đường đá Hà Giang qua bốn huyện vùng cao.' },
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

  it('từ chối destinations dạng chuỗi thường — phải bọc locale để thêm tiếng Anh sau này', () => {
    expect(() => tourSchema.parse({ ...validTour, destinations: ['Quản Bạ'] })).toThrow()
  })

  it('từ chối seo.title dạng chuỗi thường — tiêu đề SEO cũng hướng người đọc', () => {
    expect(() =>
      tourSchema.parse({ ...validTour, seo: { ...validTour.seo, title: 'Tour Hà Giang' } }),
    ).toThrow()
  })
})

// ── Địa điểm và Chuyến đã đi (GĐ3) ──────────────────────────────────────────

const validLocation = {
  slug: 'homestay-cuc-bac',
  name: { vi: 'Homestay Cực Bắc' },
  category: 'luu-tru' as const,
  excerpt: { vi: 'Nhà sàn nhìn thẳng ra thung lũng.' },
  body: [{ vi: 'Chủ nhà là người Mông, nấu cơm cho khách ăn cùng gia đình.' }],
  images: [validImage],
  seo: {
    title: { vi: 'Homestay Cực Bắc, Đồng Văn' },
    description: { vi: 'Nhà sàn nhìn ra thung lũng ở Đồng Văn.' },
    ogImage: validImage,
  },
}

describe('locationSchema', () => {
  it('chấp nhận địa điểm hợp lệ không có địa chỉ và website', () => {
    // Cả hai đều không bắt buộc: một khúc sông hay một con đèo không có địa chỉ
    // bưu chính, và phần lớn hàng quán vùng cao không có web.
    expect(() => locationSchema.parse(validLocation)).not.toThrow()
  })

  it('từ chối website là chuỗi rỗng thay vì bỏ trống', () => {
    // Đây là lỗi thật của lớp ánh xạ, không phải giả thuyết: Payload lưu ô text
    // để trống thành '' chứ không phải undefined. mapLocation phải bỏ hẳn khoá
    // đó đi, và test này chốt lại rằng zod sẽ bắt nếu ai đó gỡ phần lọc ra.
    expect(() => locationSchema.parse({ ...validLocation, website: '' })).toThrow()
  })

  it('từ chối loại địa điểm ngoài danh sách cho trước', () => {
    expect(() => locationSchema.parse({ ...validLocation, category: 'quan-bar' })).toThrow()
  })

  it('từ chối địa điểm không có ảnh nào', () => {
    // Thẻ địa điểm luôn đọc images[0] — không có ảnh là thẻ vỡ.
    expect(() => locationSchema.parse({ ...validLocation, images: [] })).toThrow()
  })
})

const validCase = {
  slug: 'ha-giang-nhom-chin-nguoi',
  title: { vi: 'Hà Giang cho một nhóm chín người' },
  subtitle: { vi: 'Sáu ngày cuối tháng Mười' },
  accent: 'xanh-reu' as const,
  heroImage: validImage,
  thumbnail: validImage,
  highlights: [{ vi: 'Nhóm chín người, ba thế hệ, một chiếc xe.' }],
  ourRole: [{ vi: 'Đặt xe và tài xế quen đường đèo' }],
  days: [
    {
      day: 1,
      title: { vi: 'Hà Nội – Hà Giang' },
      body: [{ vi: 'Khởi hành lúc năm giờ sáng.' }],
      images: [],
      locations: [],
    },
  ],
  seo: {
    title: { vi: 'Chuyến Hà Giang cho nhóm chín người' },
    description: { vi: 'Sáu ngày Hà Giang cho một gia đình ba thế hệ.' },
    ogImage: validImage,
  },
}

describe('caseStudySchema', () => {
  it('chấp nhận bài hợp lệ', () => {
    expect(() => caseStudySchema.parse(validCase)).not.toThrow()
  })

  it('từ chối màu nhấn ngoài bảng đã đo tương phản', () => {
    // Bảng màu nằm ở ba nơi phải khớp nhau: MAU_NHAN (CaseStudies.ts), enum này,
    // và các khối [data-accent] trong globals.css. Thêm màu mà quên đo tương
    // phản là chữ tiêu đề trượt chuẩn WCAG mà không ai thấy.
    expect(() => caseStudySchema.parse({ ...validCase, accent: 'hong-neon' })).toThrow()
  })

  it('từ chối bài không có ngày nào', () => {
    expect(() => caseStudySchema.parse({ ...validCase, days: [] })).toThrow()
  })

  it('KHÔNG đòi số ngày khớp một trường độ dài nào cả', () => {
    // Khác hẳn tourSchema (có refine ép itinerary.length === durationDays). Đây
    // là bài viết, không phải bảng lịch trình: được phép gộp hai ngày nhạt vào
    // một mục hoặc bỏ hẳn ngày cuối chỉ ngồi sân bay.
    const nhieuNgay = {
      ...validCase,
      days: [validCase.days[0], { ...validCase.days[0], day: 2 }],
    }
    expect(() => caseStudySchema.parse(nhieuNgay)).not.toThrow()
  })
})
