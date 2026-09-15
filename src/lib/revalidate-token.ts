import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Token gọi route làm mới cache, tạo từ PAYLOAD_SECRET. Không gửi khóa gốc qua mạng
 * và không cần thêm biến môi trường riêng trên Vercel.
 */
export function revalidateToken(secret: string): string {
  return createHmac('sha256', secret).update('rosatravel:revalidate').digest('hex')
}

/** So khớp header `Authorization: Bearer <token>` (so sánh thời gian cố định). */
export function isValidRevalidateAuth(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith('Bearer ')) return false
  const received = Buffer.from(header.slice('Bearer '.length).trim())
  const expected = Buffer.from(revalidateToken(secret))
  return received.length === expected.length && timingSafeEqual(received, expected)
}
