import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

type TextareaProps = ComponentProps<'textarea'> & {
  invalid?: boolean
}

/** Cùng kiểu với Input. */
export function Textarea({ className, invalid, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full resize-y rounded-sm border border-ink bg-canvas px-4 py-3 text-body-md text-ink transition-colors duration-(--duration-fast) placeholder:text-body-mid',
        'focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-primary/25',
        'aria-invalid:border-error aria-invalid:focus-visible:outline-error/25',
        'disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-body-mid',
        className,
      )}
      {...props}
    />
  )
}
