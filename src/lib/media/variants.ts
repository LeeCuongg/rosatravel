import sharp from 'sharp'

/**
 * Bốn mốc bề rộng dùng chung cho toàn dự án.
 *
 * PHẢI khớp `deviceSizes` trong `next.config.ts` và quy ước trong
 * `src/lib/media/loader.ts`. Lệch một chỗ là srcset trỏ tới file không tồn tại.
 */
export const MEDIA_WIDTHS = [640, 1024, 1600, 2400] as const

/**
 * Ảnh chia sẻ mạng xã hội. JPEG, không hậu tố kích thước — URL này KHÔNG đi qua
 * next/image nên loader không chạy, và Zalo lẫn Facebook đều không đọc được AVIF.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const

/**
 * Ảnh mờ giữ chỗ, nhúng thẳng vào HTML dưới dạng data URL.
 *
 * Cố ý giữ ở 16px: chuỗi này xuất hiện trong HTML của mọi trang dùng ảnh đó,
 * nên mỗi byte thừa là phạt trực tiếp vào thời gian tải trang.
 */
export async function generateBlurDataURL(input: Buffer): Promise<string> {
  const buffer = await sharp(input).resize(16).webp({ quality: 40 }).toBuffer()
  return `data:image/webp;base64,${buffer.toString('base64')}`
}
