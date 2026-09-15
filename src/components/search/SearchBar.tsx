'use client'

import { Search } from 'lucide-react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { getPathname, Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { formatVnd } from '@/lib/format'
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from '@/lib/search'

type Suggestion = {
  slug: string
  title: string
  price: number
  image: string
  durationDays: number
  durationNights: number
}

type SearchBarProps = {
  defaultValue?: string
  /** Chữ gợi ý do admin đặt; trống thì dùng câu mặc định. */
  placeholder?: string | null
  /** `hero`: nổi trên banner trang chủ. `page`: trong trang tìm kiếm. */
  variant?: 'hero' | 'page'
  className?: string
}

/**
 * Ô tìm tour có gợi ý khi gõ. Là form GET tới /tim-kiem nên vẫn tìm được khi chưa
 * tải JavaScript; gợi ý dùng mẫu combobox (mũi tên lên/xuống, Enter, Esc).
 */
export function SearchBar({ defaultValue = '', placeholder, variant = 'page', className }: SearchBarProps) {
  const t = useTranslations('Search')
  const tTour = useTranslations('Tour')
  const locale = useLocale()
  const router = useRouter()

  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [fetched, setFetched] = useState<{ query: string; tours: Suggestion[]; total: number } | null>(null)

  const rootRef = useRef<HTMLFormElement>(null)
  const inputId = useId()
  const listId = useId()

  const trimmed = value.trim()
  const ready = trimmed.length >= SEARCH_MIN_LENGTH
  const results = fetched && fetched.query === trimmed ? fetched : null
  const panelVisible = open && ready && results !== null

  useEffect(() => {
    if (trimmed.length < SEARCH_MIN_LENGTH) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/next/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`, {
          signal: controller.signal,
        })
        if (!response.ok) return
        const data = (await response.json()) as { tours: Suggestion[]; total: number }
        setFetched({ query: trimmed, tours: data.tours, total: data.total })
        setActive(-1)
      } catch {
        // Hủy do gõ tiếp hoặc lỗi mạng: giữ nguyên, form vẫn gửi được bằng nút Tìm.
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, locale])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const goToTour = (slug: string) => {
    setOpen(false)
    router.push(`/tour/${slug}`)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const selected = results?.tours[active]
    if (panelVisible && selected) {
      event.preventDefault()
      goToTour(selected.slug)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = results?.tours.length ?? 0
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault()
      setOpen(true)
      setActive((index) => (index + 1) % count)
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault()
      setActive((index) => (index <= 0 ? count - 1 : index - 1))
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <form
      ref={rootRef}
      role="search"
      action={getPathname({ href: '/tim-kiem', locale })}
      method="get"
      onSubmit={onSubmit}
      className={cn('relative', className)}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-md bg-canvas p-2',
          variant === 'hero' ? 'shadow-panel' : 'border border-ink',
        )}
      >
        <Search aria-hidden className="ml-2 size-5 shrink-0 text-body" />
        <label htmlFor={inputId} className="sr-only">
          {t('label')}
        </label>
        <input
          id={inputId}
          name="q"
          type="search"
          value={value}
          maxLength={SEARCH_MAX_LENGTH}
          autoComplete="off"
          placeholder={placeholder || t('placeholder')}
          role="combobox"
          aria-expanded={panelVisible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={panelVisible && active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(event) => {
            setValue(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-11 min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-body-mid focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <Button type="submit" size="sm" className="h-11">
          {t('submit')}
        </Button>
      </div>

      {/* Luôn nằm trong DOM để đóng cũng có chuyển động; `inert` chặn tương tác khi ẩn. */}
      <div
        inert={!panelVisible}
        className={cn(
          'absolute inset-x-0 top-full z-30 mt-2 origin-top overflow-hidden rounded-md border border-mute/60 bg-canvas text-left shadow-panel transition-[opacity,transform] duration-(--duration-base) ease-brand',
          panelVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
        )}
      >
        {results?.tours.length ? (
          <ul id={listId} role="listbox" aria-label={t('suggestions')} className="max-h-96 overflow-y-auto p-2">
            {results.tours.map((tour, index) => (
              <li
                key={tour.slug}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                // Giữ tiêu điểm ở ô nhập khi bấm chuột vào gợi ý.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => goToTour(tour.slug)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-sm p-2 transition-colors',
                  index === active ? 'bg-canvas-soft' : 'hover:bg-canvas-soft',
                )}
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-canvas-soft">
                  <Image src={tour.image} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{tour.title}</span>
                  <span className="block text-caption text-body">
                    {tTour('duration', { days: tour.durationDays, nights: tour.durationNights })} ·{' '}
                    <span className="font-semibold text-primary">{formatVnd(tour.price)}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p id={listId} className="p-4 text-body-sm text-body">
            {t('noSuggestions')}
          </p>
        )}
        {results && results.total > results.tours.length ? (
          <Link
            href={`/tim-kiem?q=${encodeURIComponent(trimmed)}`}
            onClick={() => setOpen(false)}
            className="block border-t border-mute/60 p-3 text-center text-body-sm font-semibold text-ink hover:text-primary"
          >
            {t('viewAll', { count: results.total })}
          </Link>
        ) : null}
      </div>
    </form>
  )
}
