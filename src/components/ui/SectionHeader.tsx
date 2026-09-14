import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'

type SectionHeaderProps = {
  eyebrow?: string | null
  title: string
  description?: string | null
  /** Không truyền `label` thì dùng nhãn mặc định "Xem thêm". */
  action?: { href: string; label?: string | null } | null
  as?: 'h1' | 'h2'
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  const t = useTranslations('Common')

  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl space-y-2">
        {eyebrow ? (
          <p className="font-display text-caption font-medium tracking-[1px] text-body uppercase">
            {eyebrow}
          </p>
        ) : null}
        <Heading className="font-display text-display-sub-sm font-semibold text-balance text-ink md:text-display-md">
          {title}
        </Heading>
        {description ? <p className="text-body-md text-body">{description}</p> : null}
      </div>
      {action ? (
        // Hover chỉ gạch chân + đẩy mũi tên: không đổi cỡ/độ đậm chữ để khỏi giật layout.
        <Link
          href={action.href}
          className="group inline-flex items-center gap-2 rounded-sm text-body-sm font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {action.label || t('viewMore')}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-(--duration-fast) ease-brand group-hover:translate-x-1"
          />
        </Link>
      ) : null}
    </div>
  )
}
