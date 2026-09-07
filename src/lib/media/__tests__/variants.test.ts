import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { generateBlurDataURL, MEDIA_WIDTHS, OG_SIZE } from '../variants'

async function anhMau(width = 100, height = 60): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 26, b: 33 } },
  })
    .jpeg()
    .toBuffer()
}

describe('generateBlurDataURL', () => {
  it('trả về data URL hợp lệ mà next/image chấp nhận', async () => {
    const result = await generateBlurDataURL(await anhMau())
    expect(result.startsWith('data:image/')).toBe(true)
    expect(result).toContain('base64,')
  })

  it('sinh ra chuỗi đủ ngắn để nhúng vào HTML mà không phình trang', async () => {
    const result = await generateBlurDataURL(await anhMau(2400, 1350))
    // Ảnh mờ phải nhỏ hơn 2KB — nó được nhúng thẳng vào HTML của mọi trang
    // dùng ảnh đó, nên phình lên là phạt trực tiếp vào thời gian tải.
    expect(result.length).toBeLessThan(2048)
  })

  it('cùng một ảnh cho ra cùng một chuỗi', async () => {
    const anh = await anhMau()
    expect(await generateBlurDataURL(anh)).toBe(await generateBlurDataURL(anh))
  })
})

describe('hằng số', () => {
  it('giữ nguyên bốn mốc bề rộng của GĐ1', () => {
    // Loader ảnh và cấu hình deviceSizes trong next.config.ts đều dựa vào
    // đúng bốn con số này. Lệch một chỗ là srcset sinh ra URL không tồn tại.
    expect(MEDIA_WIDTHS).toEqual([640, 1024, 1600, 2400])
  })

  it('ảnh chia sẻ mạng xã hội đúng 1200x630', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
  })
})
