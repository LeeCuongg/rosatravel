import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export const containerClassName = 'mx-auto w-full max-w-7xl px-5 lg:px-8'

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn(containerClassName, className)} {...props} />
}
