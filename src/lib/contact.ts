import type { ContactChannelKey, ContactSettings } from '@/types/content'

/** Thứ tự hiển thị các kênh trong FloatingContact. */
export const CONTACT_CHANNEL_ORDER: ContactChannelKey[] = [
  'zalo',
  'messenger',
  'facebook',
  'instagram',
  'threads',
]

export type ContactChannelLink = {
  key: ContactChannelKey
  href: string
}

function clean(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** "0973 122 807" → "tel:+84973122807". Số đã có mã quốc gia (+84…/84…) giữ nguyên. */
export function toTelHref(phone: string): string {
  const hasPlus = phone.trim().startsWith('+')
  const digits = phone.replace(/\D/g, '')
  if (hasPlus) return `tel:+${digits}`
  if (digits.startsWith('0')) return `tel:+84${digits.slice(1)}`
  if (digits.startsWith('84')) return `tel:+${digits}`
  return `tel:${digits}`
}

/** Nhân viên nhập số điện thoại hoặc link đầy đủ (Zalo OA) — cả hai đều chấp nhận. */
export function toZaloHref(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  return `https://zalo.me/${value.replace(/\D/g, '')}`
}

/** Các kênh có giá trị, đúng thứ tự hiển thị. Kênh trống bị bỏ qua. */
export function buildChannelLinks(settings: ContactSettings): ContactChannelLink[] {
  return CONTACT_CHANNEL_ORDER.flatMap((key) => {
    const value = clean(settings[key])
    if (!value) return []
    return [{ key, href: key === 'zalo' ? toZaloHref(value) : value }]
  })
}

export function hotlineHref(settings: ContactSettings): string | null {
  const hotline = clean(settings.hotline)
  return hotline ? toTelHref(hotline) : null
}
