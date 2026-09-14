import Image from 'next/image'
import type { ComponentProps } from 'react'

import { Price } from '@/components/ui/Price'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { TourSummary } from '@/types/content'

type TourMiniCardProps = Omit<ComponentProps<typeof Link>, 'href' | 'children'> & {
  tour: TourSummary
}

/** Thẻ tour thu gọn trong mega menu. Nhận thêm props để bọc được bằng `NavigationMenu.Link asChild`. */
export function TourMiniCard({ tour, className, ...props }: TourMiniCardProps) {
  return (
    <Link
      href={`/tour/${tour.slug}`}
      className={cn(
        'group flex gap-3 rounded-md p-2 transition-colors duration-(--duration-fast) ease-brand hover:bg-canvas-soft focus-visible:outline-2 focus-visible:outline-primary',
        className,
      )}
      {...props}
    >
      <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-sm">
        <Image
          src={tour.coverImage.url}
          alt={tour.coverImage.alt}
          fill
          sizes="96px"
          className="object-cover transition-transform duration-(--duration-zoom) ease-brand group-hover:scale-110"
        />
      </span>
      <span className="flex min-w-0 flex-col justify-between gap-1">
        <span className="line-clamp-2 text-body-sm font-semibold text-ink">{tour.title}</span>
        <Price price={tour.price} showFrom className="items-start" />
      </span>
    </Link>
  )
}
