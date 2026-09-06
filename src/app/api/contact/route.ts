import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { validateContactInput } from '@/lib/contact/validate'

// Rate limit đơn giản trong bộ nhớ. Đủ để chặn spam thô; instance serverless bị
// tái tạo nên đây không phải hàng rào chắc chắn, chỉ là lớp đầu tiên.
const recentRequests = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 3

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (recentRequests.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (timestamps.length >= MAX_PER_WINDOW) return true
  timestamps.push(now)
  recentRequests.set(ip, timestamps)
  return false
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Quá nhiều yêu cầu' }, { status: 429 })
  }

  const result = validateContactInput(await request.json().catch(() => null))
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_EMAIL_TO
  const from = process.env.CONTACT_EMAIL_FROM
  if (!apiKey || !to || !from) {
    console.error('Thiếu biến môi trường RESEND_API_KEY / CONTACT_EMAIL_TO / CONTACT_EMAIL_FROM')
    return NextResponse.json({ error: 'Cấu hình email chưa sẵn sàng' }, { status: 500 })
  }

  const { name, phone, tourSlug, note } = result.data

  try {
    await new Resend(apiKey).emails.send({
      from,
      to,
      subject: `Yêu cầu đặt tour: ${name}`,
      text: [
        `Họ tên: ${name}`,
        `Điện thoại: ${phone}`,
        `Tour quan tâm: ${tourSlug || '(không chọn)'}`,
        `Ghi chú: ${note || '(không có)'}`,
      ].join('\n'),
    })
  } catch (error) {
    console.error('Gửi email thất bại', error)
    return NextResponse.json({ error: 'Không gửi được' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
