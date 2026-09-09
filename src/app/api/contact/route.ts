import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { Resend } from 'resend'
import config from '@payload-config'
import { NHAN_TRUONG, chonCauHinhEmail } from '@/lib/contact/cau-hinh'
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

  // Cấu hình lấy từ /admin trước, biến môi trường sau — xem lib/contact/cau-hinh.ts.
  //
  // Đọc global bọc trong try/catch: database chết không được biến thành lỗi
  // "cấu hình email" khó hiểu. Không đọc được thì coi như admin chưa đặt gì và
  // rơi về biến môi trường, để form vẫn gửi được nếu env có đủ.
  let tuAdmin: Record<string, unknown> | null = null
  try {
    const payload = await getPayload({ config })
    // Ép qua `unknown` trước: kiểu global sinh tự động không có index
    // signature nên TypeScript chặn phép ép thẳng — cùng khuôn mẫu đã dùng ở
    // mapHome và các script seed.
    tuAdmin = (await payload.findGlobal({ slug: 'cai-dat-email', depth: 0 })) as unknown as Record<
      string,
      unknown
    >
  } catch (error) {
    console.error('Không đọc được Cấu hình email trong /admin, thử dùng biến môi trường', error)
  }

  const cauHinh = chonCauHinhEmail(tuAdmin, {
    apiKey: process.env.RESEND_API_KEY,
    emailTo: process.env.CONTACT_EMAIL_TO,
    emailFrom: process.env.CONTACT_EMAIL_FROM,
  })

  if (!cauHinh.ok) {
    // Nêu ĐÍCH DANH trường nào thiếu và chỉ đúng chỗ điền. Thông báo cũ chỉ đọc
    // được với người biết biến môi trường là gì — tức là không phải người vận
    // hành, mà họ mới là người sửa được.
    console.error(
      `Chưa cấu hình email. Còn thiếu: ${cauHinh.thieu.map((k) => NHAN_TRUONG[k]).join(', ')}. ` +
        'Điền tại /admin → Cấu hình email, hoặc đặt biến môi trường tương ứng.',
    )
    return NextResponse.json({ error: 'Cấu hình email chưa sẵn sàng' }, { status: 500 })
  }

  const { apiKey, emailTo: to, emailFrom: from } = cauHinh.data
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
