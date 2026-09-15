import type { BookingType } from './schema'

export type BookingNotice = {
  type: BookingType
  fullName: string
  phone: string
  email?: string
  tourTitle?: string
  tourUrl?: string
  departureDate?: string
  adults?: number
  children?: number
  message?: string
  page?: string
  adminUrl: string
}

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  booking: 'Đặt tour',
  consultation: 'Tư vấn',
  newsletter: 'Nhận ưu đãi',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()

/** "2026-10-02" → "02/10/2026" */
function toVietnameseDate(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

/** Email báo nhân viên khi khách gửi yêu cầu. Mọi giá trị do khách nhập đều được escape. */
export function buildBookingEmail(notice: BookingNotice): { subject: string; html: string; text: string } {
  const subject = oneLine(
    [`[${BOOKING_TYPE_LABELS[notice.type]}]`, notice.fullName, notice.phone, notice.tourTitle].filter(Boolean).join(' – '),
  )

  const rows: [string, string][] = [
    ['Loại yêu cầu', BOOKING_TYPE_LABELS[notice.type]],
    ['Họ tên', notice.fullName],
    ['Số điện thoại', notice.phone],
    ['Email', notice.email ?? ''],
    ['Tour', notice.tourTitle ?? ''],
    ['Ngày khởi hành', notice.departureDate ? toVietnameseDate(notice.departureDate) : ''],
    ['Người lớn', notice.adults != null ? String(notice.adults) : ''],
    ['Trẻ em', notice.children != null ? String(notice.children) : ''],
    ['Lời nhắn', notice.message ?? ''],
    ['Gửi từ trang', notice.page ?? ''],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  const htmlRows = rows
    .map(([label, value]) => {
      const content =
        label === 'Tour' && notice.tourUrl
          ? `<a href="${escapeHtml(notice.tourUrl)}">${escapeHtml(value)}</a>`
          : escapeHtml(value).replace(/\n/g, '<br>')
      return `<tr><td style="padding:6px 12px 6px 0;color:#605d52;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;color:#201515">${content}</td></tr>`
    })
    .join('')

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">
<p style="margin:0 0 12px">Có yêu cầu mới từ website Rosa Travel:</p>
<table style="border-collapse:collapse">${htmlRows}</table>
<p style="margin:20px 0 0"><a href="${escapeHtml(notice.adminUrl)}" style="display:inline-block;background:#ff4f00;color:#fffefb;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Mở trong trang quản trị</a></p>
</div>`

  const text = [
    'Có yêu cầu mới từ website Rosa Travel:',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Mở trong trang quản trị: ${notice.adminUrl}`,
  ].join('\n')

  return { subject, html, text }
}
