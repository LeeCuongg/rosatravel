import Image from 'next/image'
import type { ImageAsset } from '@/lib/content'

interface MediaProps {
  media: ImageAsset
  /** Bắt buộc — quyết định trình duyệt tải biến thể nào. Sai `sizes` là hỏng LCP. */
  sizes: string
  locale: 'vi' | 'en'
  priority?: boolean
  className?: string
  fill?: boolean
}

export function Media({ media, sizes, locale, priority, className, fill }: MediaProps) {
  const alt = media.alt[locale] ?? media.alt.vi

  return (
    <Image
      src={media.src}
      alt={alt}
      {...(fill ? { fill: true } : { width: media.width, height: media.height })}
      sizes={sizes}
      placeholder="blur"
      blurDataURL={media.blurDataURL}
      priority={priority}
      className={className}
    />
  )
}
