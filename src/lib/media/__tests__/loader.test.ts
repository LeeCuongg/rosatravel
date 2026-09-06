import { describe, expect, it } from 'vitest'
import mediaLoader, { MEDIA_WIDTHS } from '../loader'

describe('mediaLoader', () => {
  it('chọn biến thể nhỏ nhất đủ lớn cho bề rộng yêu cầu', () => {
    expect(mediaLoader({ src: '/media/a.avif', width: 800, quality: 75 })).toBe(
      '/media/a-1024.avif',
    )
  })

  it('khớp chính xác khi bề rộng trùng một mốc', () => {
    expect(mediaLoader({ src: '/media/a.avif', width: 1024, quality: 75 })).toBe(
      '/media/a-1024.avif',
    )
  })

  it('dùng biến thể lớn nhất khi yêu cầu vượt mọi mốc', () => {
    expect(mediaLoader({ src: '/media/a.avif', width: 4000, quality: 75 })).toBe(
      `/media/a-${MEDIA_WIDTHS.at(-1)}.avif`,
    )
  })

  it('giữ nguyên URL tuyệt đối vì file đó do CDN ngoài phục vụ', () => {
    const url = 'https://cdn.example.com/a.avif'
    expect(mediaLoader({ src: url, width: 800, quality: 75 })).toBe(url)
  })

  it('không thêm hậu tố hai lần cho src đã có sẵn mốc', () => {
    expect(mediaLoader({ src: '/media/a-1024.avif', width: 800, quality: 75 })).toBe(
      '/media/a-1024.avif',
    )
  })

  it('xử lý được đường dẫn nhiều cấp có dấu chấm trong tên thư mục', () => {
    expect(mediaLoader({ src: '/media/tours/ha.giang/x.avif', width: 600, quality: 75 })).toBe(
      '/media/tours/ha.giang/x-640.avif',
    )
  })
})
