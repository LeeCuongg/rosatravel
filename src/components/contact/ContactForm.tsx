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
   * Ô NHẬP LÀ MỘT HỘP VIỀN NÉT ĐỨT, không phải một đường kẻ dưới.
   *
   * Bản trước dùng kẻ dưới, dựa trên lập luận rằng "ô viền kín bo góc là ngôn
   * ngữ của bảng điều khiển quản trị". Lập luận đó đúng với ô viền LIỀN, nền
   * xám, bo góc lớn — nhưng đã đo lại spotstravel.co và họ không làm thế: ô của
   * họ là viền NÉT ĐỨT 1px, bo 4px, nền trong suốt. Nét đứt chính là ngôn ngữ
   * đã dùng cho mọi khung trên site này, nên hộp nét đứt hoà vào hệ thống chứ
   * không phá nó — còn kẻ dưới thì để mắt tự đoán đâu là mép phải của ô.
   *
   * Số đo lấy nguyên từ họ: `1px dashed`, `border-radius 4px`, đệm 12.5/16px,
   * cao 45px, nền trong suốt.
   *
   * Màu viền là sand-100 (#403232) — ĐÚNG màu chữ chính, cũng đúng màu họ
   * dùng. Đậm hơn hẳn `rule` (#d5cbb5) của các khung trang trí, và đó là chủ
   * đích: khung là đồ trang trí, ô nhập là thứ phải bấm vào được.
   *
   * Khi focus, viền chuyển sang NÉT LIỀN màu đất nung — đổi cả kiểu nét chứ
   * không chỉ đổi màu, để người phân biệt màu kém vẫn thấy ô đang chọn.
   */
  const inputClass =
    'h-[45px] w-full rounded border border-dashed border-sand-100 bg-transparent px-4 ' +
    'text-body text-sand-100 outline-none transition-colors ' +
    'duration-[var(--duration-base)] ease-[var(--ease-hover)] ' +
    'focus:border-solid focus:border-clay-500'

  /**
   * Nhãn KHÔNG viết hoa toàn bộ.
   *
   * Nhãn chữ hoa nhỏ (Eyebrow) là để đặt tên cho cả một KHỐI nội dung. Dùng nó
   * cho từng ô nhập thì một biểu mẫu bốn ô có bốn dòng chữ hoa chen nhau, và
   * chữ hoa giãn 0.12em ở cỡ 12px đọc chậm hơn hẳn chữ thường — đúng thứ không
   * nên có ở nơi người ta đang phải điền. Spots cũng tách bạch đúng như vậy:
   * nhãn khối viết hoa, nhãn ô nhập viết thường 14px.
   */
  const labelClass = 'mb-2 block text-meta text-sand-100'

  return (
    // Bề rộng 576px, bám theo cột biểu mẫu 600px của Spots. Rộng hơn thì hai ô
    // ngắn ở hàng giữa kéo dài ra thành hai thanh mỏng, và cả khối mất dáng.
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
      {/* Lưới SÁU cột với khoảng hở 10px — đúng bố cục đã đo bên Spots. Sáu cột
          chứ không phải hai: nó chia được cả 2 (3+3) lẫn 3 (2+2+2) mà không
          phải đổi lưới, nên thêm một ô nữa sau này không phải dựng lại. */}
      <div className="grid grid-cols-6 gap-2.5">
        {tours.length > 0 && (
          // Ô rộng cả hàng, đứng đầu — cùng vai trò với ô "Where" của họ: câu
          // hỏi lớn nhất hỏi trước, thông tin liên hệ hỏi sau.
          <label className="col-span-6">
            <span className={labelClass}>{t('tour')}</span>
            {/* appearance-none để bỏ nền và mũi tên mặc định của hệ điều hành —
                không bỏ thì trên Windows ô select hiện ra một khối xám đặc
                giữa các ô còn lại. */}
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

        {/* Hai ô ngắn đứng cạnh nhau, mỗi ô nửa hàng — đúng cặp "When / Who".
            Trên điện thoại chúng tự xuống dòng thành hai hàng đầy. */}
        <label className="col-span-6 sm:col-span-3">
          <span className={labelClass}>{t('name')}</span>
          <input name="name" required className={inputClass} />
        </label>

        <label className="col-span-6 sm:col-span-3">
          <span className={labelClass}>{t('phone')}</span>
          <input name="phone" type="tel" required inputMode="tel" className={inputClass} />
        </label>

        <label className="col-span-6">
          <span className={labelClass}>{t('note')}</span>
          {/* h-auto ghi đè chiều cao 45px cố định của inputClass: ô ghi chú là
              chỗ duy nhất người ta gõ nhiều dòng. */}
          <textarea
            name="note"
            rows={3}
            defaultValue={defaultNote}
            placeholder={t('notePlaceholder')}
            className={`${inputClass} h-auto resize-none py-3 placeholder:text-ink-700`}
          />
        </label>
      </div>

      {/* Honeypot: ẩn khỏi người dùng và khỏi trình đọc màn hình, bot vẫn điền. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0"
      />

      <div className="mt-8 flex flex-col items-center gap-4">
        <SubmitButton type="submit" disabled={status === 'sending'}>
          {/* Biểu tượng phong bì vẽ tay bằng hai nét, không dùng thư viện icon:
              kéo cả một gói icon về cho đúng một hình là đổi vài KB bundle lấy
              một chiếc phong bì. `aria-hidden` vì chữ ngay bên cạnh đã nói rồi. */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4 shrink-0"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
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
