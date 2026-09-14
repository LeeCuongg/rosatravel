type RosaMarkProps = {
  className?: string
}

/** Ghim bản đồ + hồng dại 5 cánh. Bản gốc: docs/brand/rosa-mark.svg. */
export function RosaMark({ className }: RosaMarkProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M32 3C18.7 3 8 13.5 8 26.5 8 44 32 61 32 61S56 44 56 26.5C56 13.5 45.3 3 32 3Z"
        fill="var(--color-primary)"
      />
      <g fill="var(--color-canvas)">
        <circle cx="32" cy="19" r="6.4" />
        <circle cx="38.66" cy="23.84" r="6.4" />
        <circle cx="36.11" cy="31.66" r="6.4" />
        <circle cx="27.89" cy="31.66" r="6.4" />
        <circle cx="25.34" cy="23.84" r="6.4" />
        <circle cx="32" cy="26" r="6" />
      </g>
      <circle cx="32" cy="26" r="3.2" fill="var(--color-primary)" />
    </svg>
  )
}

type LogoProps = {
  /** `dark` dùng trên nền ink (footer). */
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * Chữ dựng bằng HTML thay vì <text> trong SVG để luôn đúng font Be Vietnam Pro
 * do next/font nạp, và để trình đọc màn hình đọc được "Rosa Travel".
 */
export function Logo({ variant = 'light', className }: LogoProps) {
  const dark = variant === 'dark'

  return (
    <span className={['inline-flex items-center gap-2', className].filter(Boolean).join(' ')}>
      <RosaMark className="size-10 shrink-0" />
      <span className="font-display text-2xl leading-none tracking-[-0.5px]">
        <span className={dark ? 'font-bold text-canvas' : 'font-bold text-ink'}>Rosa</span>{' '}
        <span className={dark ? 'font-medium text-mute' : 'font-medium text-body'}>Travel</span>
      </span>
    </span>
  )
}
