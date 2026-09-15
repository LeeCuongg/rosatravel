import { describe, expect, it } from 'vitest'

import { buildBookingEmail } from './email'
import { normalizePhone, parseBookingForm, todayInVietnam } from './schema'
import { createRateLimiter, HONEYPOT_FIELD, isLikelyBot, STARTED_AT_FIELD } from './spam'

const NOW = new Date('2026-09-15T03:00:00Z')

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

describe('normalizePhone', () => {
  it('đưa số Việt Nam về dạng 0xxxxxxxxx', () => {
    expect(normalizePhone('0973 122 807')).toBe('0973122807')
    expect(normalizePhone('+84 973.122.807')).toBe('0973122807')
    expect(normalizePhone('84973122807')).toBe('0973122807')
  })

  it('giữ số nước ngoài có dấu +', () => {
    expect(normalizePhone('+852 9123 4567')).toBe('+85291234567')
  })
})

describe('todayInVietnam', () => {
  it('tính theo giờ Việt Nam, không theo UTC', () => {
    expect(todayInVietnam(new Date('2026-09-15T18:30:00Z'))).toBe('2026-09-16')
  })
})

describe('parseBookingForm', () => {
  it('nhận yêu cầu hợp lệ và bỏ qua ô trống', () => {
    const result = parseBookingForm(
      form({
        type: 'booking',
        fullName: '  Nguyễn Văn A ',
        phone: '0973 122 807',
        email: '',
        tour: '64b7f1c2a1b2c3d4e5f60718',
        departureDate: '2026-10-02',
        adults: '2',
        children: '',
        message: '',
      }),
      NOW,
    )
    expect(result).toEqual({
      success: true,
      data: {
        type: 'booking',
        fullName: 'Nguyễn Văn A',
        phone: '0973122807',
        tour: '64b7f1c2a1b2c3d4e5f60718',
        departureDate: '2026-10-02',
        adults: 2,
      },
    })
  })

  it('báo đúng các ô sai', () => {
    const result = parseBookingForm(
      form({
        type: 'booking',
        fullName: 'A',
        phone: '12345',
        email: 'khong-phai-email',
        departureDate: '2026-09-14',
        adults: '0',
      }),
      NOW,
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.invalidFields.sort()).toEqual(['adults', 'departureDate', 'email', 'fullName', 'phone'])
    }
  })

  it('chấp nhận ngày khởi hành là hôm nay', () => {
    const result = parseBookingForm(
      form({ type: 'consultation', fullName: 'Bình', phone: '0912345678', departureDate: '2026-09-15' }),
      NOW,
    )
    expect(result.success).toBe(true)
  })

  it('từ chối loại yêu cầu lạ', () => {
    const result = parseBookingForm(form({ type: 'hack', fullName: 'Bình', phone: '0912345678' }), NOW)
    expect(result).toEqual({ success: false, invalidFields: ['type'] })
  })
})

describe('isLikelyBot', () => {
  it('bắt bot điền ô bẫy', () => {
    expect(isLikelyBot(form({ [HONEYPOT_FIELD]: 'https://spam.example' }))).toBe(true)
  })

  it('bắt form gửi quá nhanh, nhưng không chặn khi thiếu mốc thời gian (không có JS)', () => {
    const now = 1_000_000
    expect(isLikelyBot(form({ [STARTED_AT_FIELD]: String(now - 500) }), now)).toBe(true)
    expect(isLikelyBot(form({ [STARTED_AT_FIELD]: String(now - 10_000) }), now)).toBe(false)
    expect(isLikelyBot(form({}), now)).toBe(false)
  })
})

describe('createRateLimiter', () => {
  it('chặn khi vượt giới hạn và mở lại sau khung thời gian', () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1000 })
    expect(allow('ip', 0)).toBe(true)
    expect(allow('ip', 100)).toBe(true)
    expect(allow('ip', 200)).toBe(false)
    expect(allow('ip-khac', 200)).toBe(true)
    expect(allow('ip', 1100)).toBe(true)
  })
})

describe('buildBookingEmail', () => {
  it('escape nội dung khách nhập và bỏ dòng trống', () => {
    const email = buildBookingEmail({
      type: 'booking',
      fullName: '<script>alert(1)</script>',
      phone: '0973122807',
      tourTitle: 'Tour Hồng Kông',
      departureDate: '2026-10-02',
      message: 'Dòng 1\nDòng 2',
      adminUrl: 'https://rosatravel.vercel.app/admin/collections/booking-requests/1',
    })
    expect(email.subject).toBe('[Đặt tour] – <script>alert(1)</script> – 0973122807 – Tour Hồng Kông')
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.html).toContain('02/10/2026')
    expect(email.html).toContain('Dòng 1<br>Dòng 2')
    expect(email.text).not.toContain('Email:')
  })
})
