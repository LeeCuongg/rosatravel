'use client'

import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import { ChevronDown, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'

import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { MegaMenuPanel } from '@/components/layout/MegaMenuPanel'
import { MobileNav } from '@/components/layout/MobileNav'
import { buttonClassName } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { hotlineHref } from '@/lib/contact'
import type { ContactSettings, NavItem } from '@/types/content'

type HeaderProps = {
  /** Menu cấu hình trong admin (global `header`). */
  items: NavItem[]
  contact: ContactSettings
  bookingHref: string
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

function navLinkClassName(highlight?: boolean | null) {
  return cn(
    'relative inline-flex h-10 items-center gap-1 rounded-md px-3 text-body-sm font-semibold text-ink transition-colors duration-(--duration-fast) ease-brand',
    // Gạch chân mọc từ giữa ra hai bên (giữ từ nghiên cứu site tham khảo).
    'after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-pill after:bg-primary after:transition-transform after:duration-(--duration-slow) after:ease-brand hover:after:scale-x-100 data-[state=open]:after:scale-x-100',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    highlight && 'bg-primary text-on-primary after:hidden hover:bg-primary/90',
  )
}

export function Header({ items, contact, bookingHref }: HeaderProps) {
  const t = useTranslations()
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 8,
    () => false,
  )
  const tel = hotlineHref(contact)

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-40 border-b border-transparent bg-canvas/95 backdrop-blur-sm transition-[box-shadow,border-color] duration-(--duration-base) ease-brand data-[scrolled]:border-mute/60 data-[scrolled]:shadow-header"
    >
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-18">
        <Link
          href="/"
          aria-label={t('Nav.home')}
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <Logo />
        </Link>

        <NavigationMenu.Root aria-label={t('Nav.main')} delayDuration={80} className="hidden lg:block">
          <NavigationMenu.List className="flex items-center gap-1">
            {items.map((item) => (
              <NavigationMenu.Item key={item.href} value={item.href}>
                {item.megaMenu ? (
                  <>
                    <NavigationMenu.Trigger className={cn(navLinkClassName(item.highlight), 'group')}>
                      {item.label}
                      <ChevronDown
                        aria-hidden
                        className="size-4 transition-transform duration-(--duration-base) ease-brand group-data-[state=open]:rotate-180"
                      />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className="data-[motion^=from-]:animate-content-in data-[motion^=to-]:animate-content-out">
                      <MegaMenuPanel item={item} />
                    </NavigationMenu.Content>
                  </>
                ) : (
                  <NavigationMenu.Link asChild>
                    <Link href={item.href} className={navLinkClassName(item.highlight)}>
                      {item.label}
                    </Link>
                  </NavigationMenu.Link>
                )}
              </NavigationMenu.Item>
            ))}
          </NavigationMenu.List>

          {/* Root không định vị nên khung này bám theo <header> (sticky), canh giữa toàn chiều ngang. */}
          <div className="absolute inset-x-0 top-full flex justify-center px-8 pt-2">
            <NavigationMenu.Viewport className="relative h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) origin-top overflow-hidden rounded-md border border-mute/60 bg-canvas shadow-panel transition-[width,height] duration-(--duration-base) ease-brand data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in" />
          </div>
        </NavigationMenu.Root>

        <div className="flex items-center gap-2 lg:gap-4">
          {tel ? (
            <a
              href={tel}
              className="hidden items-center gap-2 rounded-md text-body-sm font-semibold text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary xl:inline-flex"
            >
              <Phone aria-hidden className="size-4" />
              <span className="sr-only">{t('Nav.hotline')}: </span>
              {contact.hotline}
            </a>
          ) : null}
          <LocaleSwitcher className="hidden lg:flex" />
          <Link href={bookingHref} className={buttonClassName({ size: 'sm', className: 'hidden lg:inline-flex' })}>
            {t('Common.bookTour')}
          </Link>
          <MobileNav items={items} contact={contact} bookingHref={bookingHref} />
        </div>
      </Container>
    </header>
  )
}
