import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

type InputProps = ComponentProps<'input'> & {
  invalid?: boolean
}

// DESIGN-zapier text-input: nền canvas, viền 1px ink, bo 6px, chữ 18px.
export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-12 w-full rounded-sm border border-ink bg-canvas px-4 text-body-md text-ink transition-colors duration-(--duration-fast) placeholder:text-body-mid',
        'focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-primary/25',
        'aria-invalid:border-error aria-invalid:focus-visible:outline-error/25',
        'disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-body-mid',
        className,
      )}
      {...props}
    />
  )
}
