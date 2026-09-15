'use client'

import { useLocale } from 'next-intl'
import { useSyncExternalStore } from 'react'

import type { BookingType } from '@/lib/booking/schema'
import { HONEYPOT_FIELD, STARTED_AT_FIELD } from '@/lib/booking/spam'

const subscribeNever = () => () => {}
// Mốc lúc mã form được tải trên trình duyệt; server không có (form vẫn gửi được khi chưa có JS).
const loadedAt = typeof window === 'undefined' ? '' : String(Date.now())

/** Ô ẩn đi kèm mọi form yêu cầu: loại yêu cầu, nguồn truy cập, chống spam. */
export function FormMeta({ type, tourId }: { type: BookingType; tourId?: string }) {
  const locale = useLocale()
  const location = useSyncExternalStore(
    subscribeNever,
    () => `${window.location.pathname}${window.location.search}`,
    () => '',
  )
  const [pathname = '', search = ''] = location.split('?')
  const params = new URLSearchParams(search)

  return (
    <>
      <input type="hidden" name="type" value={type} />
      {tourId ? <input type="hidden" name="tour" value={tourId} /> : null}
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="page" value={pathname} />
      <input type="hidden" name={STARTED_AT_FIELD} value={location ? loadedAt : ''} />
      {(['utm_source', 'utm_medium', 'utm_campaign'] as const).map((name) => (
        <input key={name} type="hidden" name={name} value={params.get(name) ?? ''} />
      ))}
      {/* Ô bẫy bot: người dùng không thấy, trình đọc màn hình bỏ qua. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Website
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
    </>
  )
}
