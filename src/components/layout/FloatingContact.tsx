'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { MessageCircle, Phone, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'

import { BrandIcon } from '@/components/ui/BrandIcon'
import { buttonClassName } from '@/components/ui/Button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { buildChannelLinks, hotlineHref, type ContactChannelLink } from '@/lib/contact'
import type { ContactSettings } from '@/types/content'

type FloatingContactProps = {
  /** Global `site-settings`. Kênh để trống thì tự ẩn. */
  contact: ContactSettings
  bookingHref: string
}

const barItem =
  'flex h-full w-full flex-col items-center justify-center gap-0.5 text-caption font-medium text-ink transition-colors active:bg-canvas-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary'

export function FloatingContact({ contact, bookingHref }: FloatingContactProps) {
  const t = useTranslations()
  const channels = buildChannelLinks(contact)
  const tel = hotlineHref(contact)
  const zalo = channels.find((channel) => channel.key === 'zalo')
  const extra = channels.filter((channel) => channel.key !== 'zalo')
  const columns = Number(Boolean(tel)) + Number(Boolean(zalo)) + 1 + Number(extra.length > 0)

  return (
    <>
      {channels.length ? <DesktopSpeedDial channels={channels} /> : null}

      {/* Chừa chỗ để thanh đáy không che nội dung cuối trang trên mobile. */}
      <div aria-hidden className="h-16 lg:hidden" />

      <nav
        aria-label={t('Contact.barLabel')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-mute/60 bg-canvas pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid h-16" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {tel ? (
            <li>
              <a href={tel} className={barItem}>
                <Phone aria-hidden className="size-5" />
                {t('Contact.call')}
              </a>
            </li>
          ) : null}
          {zalo ? (
            <li>
              <a href={zalo.href} target="_blank" rel="noopener noreferrer" className={barItem}>
                <BrandIcon channel="zalo" className="size-5" />
                {t('Contact.channels.zalo')}
              </a>
            </li>
          ) : null}
          <li className="p-2">
            <Link href={bookingHref} className={buttonClassName({ size: 'sm', className: 'h-full w-full' })}>
              {t('Common.bookTour')}
            </Link>
          </li>
          {extra.length ? (
            <li>
              <MoreChannelsSheet channels={extra} />
            </li>
          ) : null}
        </ul>
      </nav>
    </>
  )
}

function DesktopSpeedDial({ channels }: { channels: ContactChannelLink[] }) {
  const t = useTranslations('Contact')
  const [open, setOpen] = useState(false)
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="fixed right-6 bottom-6 z-40 hidden flex-col items-end gap-3 lg:flex">
      {/* Luôn nằm trong DOM để đóng cũng có chuyển động; `inert` chặn focus khi đang đóng. */}
      <ul id={listId} inert={!open} className="flex flex-col items-end gap-3">
        {channels.map((channel, index) => {
          const delay = open ? (channels.length - 1 - index) * 40 : index * 30
          return (
            <li
              key={channel.key}
              style={{ transitionDelay: `${delay}ms` }}
              className={cn(
                'transition-[opacity,transform] duration-(--duration-base) ease-brand',
                open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
              )}
            >
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="rounded-pill bg-ink px-3 py-1.5 text-caption font-semibold text-on-primary">
                  {t(`channels.${channel.key}`)}
                </span>
                <span className="flex size-12 items-center justify-center rounded-pill border border-ink bg-canvas text-ink shadow-panel transition-colors duration-(--duration-fast) group-hover:bg-ink group-hover:text-on-primary">
                  <BrandIcon channel={channel.key} className="size-5" />
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? t('close') : t('open')}
        onClick={() => setOpen((value) => !value)}
        className="flex size-14 items-center justify-center rounded-pill bg-primary text-on-primary shadow-panel transition-transform duration-(--duration-fast) ease-brand hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span className="relative size-6">
          <MessageCircle
            aria-hidden
            className={cn(
              'absolute inset-0 size-6 transition-[opacity,transform] duration-(--duration-base) ease-brand',
              open ? 'rotate-90 opacity-0' : 'opacity-100',
            )}
          />
          <X
            aria-hidden
            className={cn(
              'absolute inset-0 size-6 transition-[opacity,transform] duration-(--duration-base) ease-brand',
              open ? 'opacity-100' : '-rotate-90 opacity-0',
            )}
          />
        </span>
      </button>
    </div>
  )
}

function MoreChannelsSheet({ channels }: { channels: ContactChannelLink[] }) {
  const t = useTranslations('Contact')

  return (
    <Dialog.Root>
      <Dialog.Trigger className={barItem}>
        <Plus aria-hidden className="size-5" />
        {t('more')}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-md bg-canvas px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-panel data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in"
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-display text-display-xs font-semibold text-ink">{t('sheetTitle')}</Dialog.Title>
            <Dialog.Close
              aria-label={t('close')}
              className="inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </div>
          <ul className="grid gap-2">
            {channels.map((channel) => (
              <li key={channel.key}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 items-center gap-3 rounded-md bg-canvas-soft px-4 text-body-md font-semibold text-ink transition-colors hover:bg-mute/40 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <BrandIcon channel={channel.key} className="size-5" />
                  {t(`channels.${channel.key}`)}
                </a>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
