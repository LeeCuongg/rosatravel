'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, Menu, Phone, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'

import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { buttonClassName } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { hotlineHref } from '@/lib/contact'
import type { ContactSettings, NavItem } from '@/types/content'

type MobileNavProps = {
  items: NavItem[]
  contact: ContactSettings
  bookingHref: string
}

const iconButton =
  'inline-flex size-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-primary'

export function MobileNav({ items, contact, bookingHref }: MobileNavProps) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const baseId = useId()
  const tel = hotlineHref(contact)
  const close = () => setOpen(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger aria-label={t('Nav.openMenu')} className={cn(iconButton, 'lg:hidden')}>
        <Menu aria-hidden className="size-6" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-canvas shadow-panel data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in lg:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-mute/60 px-5">
            <Dialog.Title className="sr-only">{t('Nav.menuTitle')}</Dialog.Title>
            <Link href="/" onClick={close} aria-label={t('Nav.home')}>
              <Logo />
            </Link>
            <Dialog.Close aria-label={t('Nav.closeMenu')} className={iconButton}>
              <X aria-hidden className="size-6" />
            </Dialog.Close>
          </div>

          <nav aria-label={t('Nav.main')} className="flex-1 overflow-y-auto px-5 py-2">
            <ul className="divide-y divide-mute/60">
              {items.map((item, index) => {
                if (!item.megaMenu) {
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="block py-4 font-display text-body-lg font-semibold text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                }

                const isOpen = expanded === item.href
                const panelId = `${baseId}-panel-${index}`

                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setExpanded(isOpen ? null : item.href)}
                      className="flex w-full items-center justify-between py-4 text-left font-display text-body-lg font-semibold text-ink"
                    >
                      {item.label}
                      <ChevronDown
                        aria-hidden
                        className={cn('size-5 transition-transform duration-(--duration-base) ease-brand', isOpen && 'rotate-180')}
                      />
                    </button>
                    {/* grid-rows 0fr ↔ 1fr: mở và đóng đều có chuyển động, không giật. */}
                    <div
                      id={panelId}
                      inert={!isOpen}
                      className={cn(
                        'grid transition-[grid-template-rows] duration-(--duration-base) ease-brand',
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-4 pb-4">
                          <Link href={item.href} onClick={close} className="block text-body-sm font-semibold text-primary">
                            {t('Common.viewAll')}
                          </Link>
                          {item.megaMenu.groups.map((group) => (
                            <div key={group.title} className="space-y-2">
                              <p className="text-caption font-semibold tracking-[1px] text-body-mid uppercase">
                                {group.title}
                              </p>
                              <ul className="grid grid-cols-2 gap-2">
                                {group.links.map((link) => (
                                  <li key={link.href}>
                                    <Link href={link.href} onClick={close} className="text-body-sm text-body hover:text-ink">
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="grid gap-3 border-t border-mute/60 p-5">
            {tel ? (
              <a href={tel} className={buttonClassName({ variant: 'tertiary' })}>
                <Phone aria-hidden className="size-5" />
                {contact.hotline}
              </a>
            ) : null}
            <Link href={bookingHref} onClick={close} className={buttonClassName()}>
              {t('Common.bookTour')}
            </Link>
            <LocaleSwitcher className="justify-center" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
