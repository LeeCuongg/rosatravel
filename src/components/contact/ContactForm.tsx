'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PHONE_PATTERN } from '@/lib/contact/validate'
import { SubmitButton } from '@/components/ui/TextLink'

type Status = 'idle' | 'sending' | 'success' | 'error'

/**
 * @param tours  Danh sách tour cho ô chọn. ĐỂ TRỐNG ở những chỗ không có danh
 *   sách trong tay — ví dụ popup "Lên kế hoạch" mở từ ngăn kéo địa điểm, nơi
 *   trang chỉ nạp địa điểm chứ không nạp tour. Khi trống thì ô chọn ẩn hẳn,
 *   KHÔNG render một <select> chỉ có mỗi dấu gạch: một ô điều khiển không chọn
 *   được gì là thứ người dùng phải thử mới biết là vô dụng.
 * @param defaultNote  Chữ điền sẵn cho ô ghi chú, dùng để mang ngữ cảnh của
 *   nơi mở biểu mẫu vào email gửi đi. API chỉ nhận đúng bốn trường (xem
 *   lib/contact/validate.ts) và zod loại bỏ trường lạ, nên KHÔNG thể lén gửi
 *   ngữ cảnh qua một input ẩn — nó phải nằm trong ghi chú.
 */
export function ContactForm({
  tours = [],
  defaultNote = '',
}: {
  tours?: { slug: string; label: string }[]
  defaultNote?: string
}) {
  const t = useTranslations('contact')
  const te = useTranslations('errors')
  const params = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Giữ tham chiếu form TRƯỚC khi await: React tái sử dụng sự kiện tổng hợp,
    // sau await thì event.currentTarget đã là null và .reset() sẽ ném lỗi.
    const formEl = event.currentTarget
    const form = new FormData(formEl)

    const name = String(form.get('name') ?? '').trim()
    if (!name) {
      setStatus('error')
      setMessage(te('nameRequired'))
      return
    }

    // Cùng PHONE_PATTERN với server (src/lib/contact/validate.ts) — validate ở
    // đây chỉ để báo lỗi sớm, server vẫn là nguồn sự thật cuối cùng.
    const phone = String(form.get('phone') ?? '')
      .trim()
      .replace(/[\s.\-()]/g, '')
    if (!PHONE_PATTERN.test(phone)) {
      setStatus('error')
      setMessage(te('phoneInvalid'))
      return
    }

    setStatus('sending')

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form)),
    }).catch(() => null)

    if (response?.ok) {
      setStatus('success')
      setMessage(t('success'))
      formEl.reset()
      return
    }

    if (response?.status === 400) {
      const data: { error?: string } | null = await response.json().catch(() => null)
      setStatus('error')
      setMessage(data?.error || t('error'))
    } else if (response?.status === 429) {
      setStatus('error')
      setMessage(t('tooMany'))
    } else {
      setStatus('error')
      setMessage(t('error'))
    }
  }

  /**
   * Ô nhập chỉ có MỘT đường kẻ dưới, nét đứt, nền trong suốt.
   *
   * Bản GĐ2 dùng ô viền kín bo góc trên nền kem đậm — mẫu chuẩn của bảng điều
   * khiển quản trị, và nó kéo cả biểu mẫu ra khỏi tông biên tập của trang.
   * Đường kẻ dưới là cùng một ngôn ngữ với khung Frame và vách ngăn cột, nên
   * biểu mẫu trông như một phần của trang chứ không phải một tiện ích gắn vào.
   *
   * Màu là rule-strong (3.02:1) chứ KHÔNG phải rule (1.55:1): đây là ranh giới
   * của một thành phần điều khiển, WCAG đòi tối thiểu 3:1. Đường kẻ trang trí
   * mới được phép nhạt.
   *
   * Khi focus, kẻ chuyển sang nét liền màu đất nung — đổi cả kiểu nét chứ
   * không chỉ đổi màu, để người phân biệt màu kém vẫn thấy được ô đang chọn.
   */
  const inputClass =
    'w-full rounded-none border-b border-dashed border-rule-strong bg-transparent py-3 ' +
    'text-body outline-none transition-colors duration-[var(--duration-fast)] ' +
    'focus:border-solid focus:border-clay-500'

  const labelClass = 'block text-label uppercase text-ink-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Họ tên và điện thoại đứng cạnh nhau: hai ô ngắn xếp dọc làm biểu mẫu
          dài ra vô ích, và người đọc cảm nhận biểu mẫu dài là biểu mẫu phiền. */}
      <div className="grid gap-8 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{t('name')}</span>
          <input name="name" required className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>{t('phone')}</span>
          <input name="phone" type="tel" required inputMode="tel" className={inputClass} />
        </label>
      </div>

      {tours.length > 0 && (
        <label className="block">
          <span className={labelClass}>{t('tour')}</span>
          {/* appearance-none để bỏ nền và mũi tên mặc định của hệ điều hành —
              không bỏ thì trên Windows ô select hiện ra một khối xám đặc giữa
              các ô chỉ có đường kẻ. */}
          <select
            name="tourSlug"
            defaultValue={params.get('tour') ?? ''}
            className={`${inputClass} appearance-none`}
          >
            <option value="">—</option>
            {tours.map((tour) => (
              <option key={tour.slug} value={tour.slug}>
                {tour.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className={labelClass}>{t('note')}</span>
        <textarea
          name="note"
          rows={3}
          defaultValue={defaultNote}
          placeholder={t('notePlaceholder')}
          className={`${inputClass} resize-none placeholder:text-ink-700`}
        />
      </label>

      {/* Honeypot: ẩn khỏi người dùng và khỏi trình đọc màn hình, bot vẫn điền. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0"
      />

      <div className="flex flex-col items-center gap-4 pt-2">
        <SubmitButton type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? t('sending') : t('submit')}
        </SubmitButton>

        {message && (
          <p
            role="status"
            className={`text-meta ${status === 'error' ? 'text-clay-500' : 'text-sand-400'}`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  )
}
