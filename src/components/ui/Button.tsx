import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text'
export type ButtonSize = 'md' | 'sm'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors duration-(--duration-fast) ease-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const sizes: Record<ButtonSize, string> = {
  md: 'h-12 px-6 text-body-md',
  sm: 'h-10 px-4 text-body-sm',
}

// DESIGN-zapier: button bo 12px (không pill); chỉ primary dùng màu cam.
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary: 'bg-ink text-on-primary hover:bg-ink-soft',
  tertiary: 'border border-ink bg-canvas text-ink hover:bg-canvas-soft',
  text: 'h-auto px-0 text-ink underline-offset-4 hover:underline',
}

type ButtonStyleOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Dùng cho <Link> hoặc <a> cần trông như button. */
export function buttonClassName({ variant = 'primary', size = 'md', className }: ButtonStyleOptions = {}) {
  return cn(base, sizes[size], variants[variant], className)
}

type ButtonProps = ComponentProps<'button'> & Omit<ButtonStyleOptions, 'className'>

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName({ variant, size, className })} {...props} />
}
