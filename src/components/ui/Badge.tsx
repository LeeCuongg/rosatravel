import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type BadgeTone = 'primary' | 'ink' | 'soft'

const tones: Record<BadgeTone, string> = {
  primary: 'bg-primary text-on-primary',
  ink: 'bg-ink text-on-primary',
  soft: 'bg-canvas-soft text-ink',
}

export function Badge({
  children,
  tone = 'soft',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-caption font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
