import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

type ChipProps = {
  children: ReactNode
  href?: string
  active?: boolean
  className?: string
}

function chipClassName(active: boolean) {
  return cn(
    'inline-flex h-9 items-center rounded-pill px-4 text-body-sm font-medium whitespace-nowrap transition-colors duration-(--duration-fast) ease-brand',
    active ? 'bg-ink text-on-primary' : 'bg-canvas-soft text-ink hover:bg-mute/40',
  )
}

/** Chip lọc / gợi ý. Có `href` thì là link, không thì chỉ là nhãn. */
export function Chip({ children, href, active = false, className }: ChipProps) {
  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          chipClassName(active),
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          className,
        )}
      >
        {children}
      </Link>
    )
  }

  return <span className={cn(chipClassName(active), className)}>{children}</span>
}
