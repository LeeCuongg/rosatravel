'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

type Status = 'idle' | 'sending' | 'success' | 'error'

export function ContactForm({ tours }: { tours: { slug: string; label: string }[] }) {
  const t = useTranslations('contact')
  const params = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')

    // Giữ tham chiếu form TRƯỚC khi await: React tái sử dụng sự kiện tổng hợp,
    // sau await thì event.currentTarget đã là null và .reset() sẽ ném lỗi.
    const formEl = event.currentTarget
    const form = new FormData(formEl)

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form)),
    }).catch(() => null)

    if (response?.ok) {
      setStatus('success')
      setMessage(t('success'))
      formEl.reset()
    } else {
      setStatus('error')
      setMessage(t('error'))
    }
  }

  const inputClass =
    'w-full rounded-md border border-ink-700 bg-ink-900 px-4 py-3 outline-none focus:border-sand-400'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-ink-500">{t('name')}</span>
        <input name="name" required className={`mt-1 ${inputClass}`} />
      </label>

      <label className="block">
        <span className="text-sm text-ink-500">{t('phone')}</span>
        <input name="phone" type="tel" required inputMode="tel" className={`mt-1 ${inputClass}`} />
      </label>

      <label className="block">
        <span className="text-sm text-ink-500">{t('tour')}</span>
        <select
          name="tourSlug"
          defaultValue={params.get('tour') ?? ''}
          className={`mt-1 ${inputClass}`}
        >
          <option value="">—</option>
          {tours.map((tour) => (
            <option key={tour.slug} value={tour.slug}>
              {tour.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm text-ink-500">{t('note')}</span>
        <textarea name="note" rows={4} className={`mt-1 ${inputClass}`} />
      </label>

      {/* Honeypot: ẩn khỏi người dùng và khỏi trình đọc màn hình, bot vẫn điền. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0"
      />

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-full bg-clay-600 px-8 py-3 font-medium disabled:opacity-60"
      >
        {status === 'sending' ? t('sending') : t('submit')}
      </button>

      {message && (
        <p role="status" className={status === 'error' ? 'text-clay-500' : 'text-sand-400'}>
          {message}
        </p>
      )}
    </form>
  )
}
