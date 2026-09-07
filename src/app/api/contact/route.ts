import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { validateContactInput } from '@/lib/contact/validate'

// Rate limit đơn giản trong bộ nhớ. Đủ để chặn spam thô; instance serverless bị
// tái tạo nên đây không phải hàng rào chắc chắn, chỉ là lớp đầu tiên.
const recentRequests = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 3

// recentRequests không tự co lại — mỗi IP mới thấy là một entry ở lại vĩnh
// viễn trong bộ nhớ instance. Dọn các entry đã hết hạn ở mỗi request để map
// không phình to vô hạn trong vòng đời instance (serverless container có thể
// sống hàng giờ dưới tải liên tục).
function pruneExpired(now: number): void {
  for (const [ip, timestamps] of recentRequests) {
    const newest = timestamps[timestamps.length - 1] ?? 0
    if (now - newest >= WINDOW_MS) recentRequests.delete(ip)
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  pruneExpired(now)
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
    // Honeypot trúng bẫy trả về message 'bot' nội bộ — không lộ ra ngoài, nếu
    // không kẻ spam biết ngay trường nào là bẫy và bỏ qua nó ở lần sau.
    const message = result.error === 'bot' ? 'Dữ liệu không hợp lệ' : result.error
    return NextResponse.json({ error: message }, { status: 400 })
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
    // Không đặt replyTo: form chỉ thu số điện thoại, không thu email, nên
    // không có địa chỉ nào để trả lời trực tiếp qua email cả.
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
