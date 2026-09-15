import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

type SelectProps = ComponentProps<'select'> & {
  invalid?: boolean
}

/** Select gốc của trình duyệt (dùng tốt trên điện thoại), trình bày giống Input. */
export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <span className="relative block">
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          'h-12 w-full appearance-none rounded-sm border border-ink bg-canvas pr-10 pl-4 text-body-md text-ink transition-colors duration-(--duration-fast)',
          'focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-primary/25',
          'aria-invalid:border-error disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-body-mid',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-body" />
    </span>
  )
}
