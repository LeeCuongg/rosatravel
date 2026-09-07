import { describe, expect, it } from 'vitest'
import mediaLoader, { MEDIA_WIDTHS } from '../loader'

// Quy ước URL thật, quan sát được sau khi upload qua Payload + Vercel Blob
// (xem task-2-report.md và task-7-report.md): ảnh gốc có thể mang bất kỳ phần
// mở rộng nào (.jpg, .avif, ...), biến thể luôn là
// "<basename>-<width>.avif" — kể cả khi ảnh gốc không phải .avif.
const BASE = 'https://3cqppnvjs6vlkmjp.public.blob.vercel-storage.com/hero'

describe('mediaLoader', () => {
  it('chọn biến thể nhỏ nhất đủ lớn cho bề rộng yêu cầu, đổi phần mở rộng thành .avif', () => {
    expect(mediaLoader({ src: `${BASE}.jpg`, width: 800, quality: 75 })).toBe(
      'https://3cqppnvjs6vlkmjp.public.blob.vercel-storage.com/hero-1024.avif',
    )
  })

  it('khớp chính xác khi bề rộng trùng một mốc', () => {
    expect(mediaLoader({ src: `${BASE}.jpg`, width: 1024, quality: 75 })).toBe(
      'https://3cqppnvjs6vlkmjp.public.blob.vercel-storage.com/hero-1024.avif',
    )
  })

  it('bề rộng nằm giữa hai mốc thì chọn mốc lớn hơn, không phải mốc gần hơn', () => {
    // 1024 gần 900 hơn 1600 (khoảng cách 124 so với 700), nhưng chọn mốc nhỏ
    // hơn bề rộng yêu cầu sẽ làm ảnh bị phóng to/kéo giãn trên trình duyệt.
    expect(mediaLoader({ src: `${BASE}.jpg`, width: 1100, quality: 75 })).toBe(
      'https://3cqppnvjs6vlkmjp.public.blob.vercel-storage.com/hero-1600.avif',
    )
  })

  it('dùng biến thể lớn nhất khi yêu cầu vượt mọi mốc', () => {
    expect(mediaLoader({ src: `${BASE}.jpg`, width: 4000, quality: 75 })).toBe(
      `https://3cqppnvjs6vlkmjp.public.blob.vercel-storage.com/hero-${MEDIA_WIDTHS.at(-1)}.avif`,
    )
  })

  it('giữ nguyên URL của dịch vụ khác — không phải domain Blob của site này', () => {
    const url = 'https://cdn.example.com/a.avif'
    expect(mediaLoader({ src: url, width: 800, quality: 75 })).toBe(url)
  })

  it('không suy đoán theo tên file: ảnh gốc tình cờ trùng tên một mốc vẫn được dựng lại biến thể đúng', () => {
    // Trường hợp bẫy thật đã xảy ra: file nguồn tải lên tên "hero-2400.avif"
    // (người đặt tên, không phải do loader sinh ra). mapMedia() luôn trả URL
    // GỐC này — loader không được coi nó là "đã là biến thể rồi" và trả
    // nguyên xi, vì làm vậy nghĩa là mọi mốc nhỏ hơn đều bị bỏ qua, luôn tải
    // về bản 2400px kể cả trên điện thoại.
    expect(
      mediaLoader({
        src: 'https://3cqppnvjs6vlkmjp.public.blob.vercel-storage.com/hero-2400.avif',
        width: 640,
        quality: 75,
      }),
    ).toBe('https://3cqppnvjs6vlkmjp.public.blob.vercel-storage.com/hero-2400-640.avif')
  })

  it('xử lý được tên file không có phần mở rộng dạng bất thường mà không vỡ', () => {
    const url = 'https://3cqppnvjs6vlkmjp.public.blob.vercel-storage.com/no-extension'
    expect(mediaLoader({ src: url, width: 800, quality: 75 })).toBe(url)
  })
})
