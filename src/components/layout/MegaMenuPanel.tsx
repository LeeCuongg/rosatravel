'use client'

import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import { useTranslations } from 'next-intl'

import { TourMiniCard } from '@/components/tour/TourMiniCard'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { NavItem } from '@/types/content'

export function MegaMenuPanel({ item }: { item: NavItem }) {
  const t = useTranslations('Nav')
  const menu = item.megaMenu
  if (!menu) return null

  const tours = menu.featuredTours?.slice(0, 2) ?? []

  return (
    <div className="grid w-[min(72rem,calc(100vw-4rem))] grid-cols-12 gap-8 p-8">
      <div className={cn('grid gap-8', tours.length ? 'col-span-8 grid-cols-3' : 'col-span-12 grid-cols-4')}>
        {menu.groups.map((group) => (
          <div key={group.title} className="space-y-3">
            {group.href ? (
              <NavigationMenu.Link asChild>
                <Link
                  href={group.href}
                  className="font-display text-body-md font-semibold text-ink transition-colors hover:text-primary"
                >
                  {group.title}
                </Link>
              </NavigationMenu.Link>
            ) : (
              <p className="font-display text-body-md font-semibold text-ink">{group.title}</p>
            )}
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <NavigationMenu.Link asChild>
                    <Link
                      href={link.href}
                      className="text-body-sm text-body underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      {link.label}
                    </Link>
                  </NavigationMenu.Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {tours.length ? (
        <div className="col-span-4 space-y-2 border-l border-mute/60 pl-8">
          <p className="font-display text-caption font-medium tracking-[1px] text-body uppercase">
            {t('featuredTours')}
          </p>
          {tours.map((tour) => (
            <NavigationMenu.Link asChild key={tour.id}>
              <TourMiniCard tour={tour} />
            </NavigationMenu.Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
