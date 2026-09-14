import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gộp class có điều kiện; class Tailwind trùng nhóm thì class sau thắng. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
