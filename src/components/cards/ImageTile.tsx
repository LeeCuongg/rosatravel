import Image from 'next/image'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { ImageAsset } from '@/types/content'

type ImageTileProps = {
  href: string
  title: string
  subtitle?: string | null
  image: ImageAsset | null
  sizes?: string
  className?: string
}

/** Ô ảnh có chữ (điểm đến, danh mục): ảnh zoom chậm khi hover, gradient để chữ trắng luôn đọc được. */
export function ImageTile({
  href,
  title,
  subtitle,
  image,
  sizes = '(min-width: 1024px) 33vw, 50vw',
  className,
}: ImageTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative block overflow-hidden rounded-md bg-canvas-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        className,
      )}
    >
      {image ? (
        // Tên ở dưới đã là tên link nên ảnh để alt rỗng (trang trí).
        <Image
          src={image.url}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-(--duration-zoom) ease-brand group-hover:scale-110"
        />
      ) : null}
      <span aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/20 to-transparent" />
      <span className="absolute inset-x-4 bottom-4 lg:inset-x-6 lg:bottom-5">
        <span className="block font-display text-display-xs font-semibold text-on-primary">{title}</span>
        {subtitle ? <span className="mt-1 block line-clamp-2 text-caption text-canvas-soft/90">{subtitle}</span> : null}
      </span>
    </Link>
  )
}
