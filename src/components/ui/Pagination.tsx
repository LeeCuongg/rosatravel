import { ChevronLeft, ChevronRight } from 'lucide-react'
import NextLink from 'next/link'
import { getTranslations } from 'next-intl/server'

import { cn } from '@/lib/cn'
import { paginationRange } from '@/lib/pagination'

type PaginationProps = {
  page: number
  totalPages: number
  /** Trả về đường dẫn đầy đủ (đã có tiền tố ngôn ngữ nếu cần) của một trang. */
  hrefFor: (page: number) => string
}

const itemClass =
  'inline-flex size-11 items-center justify-center rounded-md text-body-sm font-semibold transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export async function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null
  const t = await getTranslations('Pagination')

  return (
    <nav aria-label={t('label')} className="flex flex-wrap items-center justify-center gap-1">
      {page > 1 ? (
        <NextLink href={hrefFor(page - 1)} aria-label={t('previous')} className={cn(itemClass, 'text-ink hover:bg-canvas-soft')}>
          <ChevronLeft aria-hidden className="size-5" />
        </NextLink>
      ) : null}

      {paginationRange(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-body-mid">
            …
          </span>
        ) : (
          <NextLink
            key={item}
            href={hrefFor(item)}
            aria-label={t('page', { page: item })}
            aria-current={item === page ? 'page' : undefined}
            className={cn(itemClass, item === page ? 'bg-ink text-on-primary' : 'text-ink hover:bg-canvas-soft')}
          >
            {item}
          </NextLink>
        ),
      )}

      {page < totalPages ? (
        <NextLink href={hrefFor(page + 1)} aria-label={t('next')} className={cn(itemClass, 'text-ink hover:bg-canvas-soft')}>
          <ChevronRight aria-hidden className="size-5" />
        </NextLink>
      ) : null}
    </nav>
  )
}
