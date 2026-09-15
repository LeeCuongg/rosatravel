import Image from 'next/image'

import { cn } from '@/lib/cn'
import type { ImageAsset } from '@/types/content'

/*
 * Desktop: ảnh bìa lớn bên trái + tối đa 4 ảnh nhỏ bên phải. Lưới đổi theo số ảnh
 * nhỏ để không bao giờ có ô trống. Mobile chỉ hiện ảnh bìa.
 */
const layouts: Record<number, { grid: string; cover: string; side: string[] }> = {
  0: { grid: '', cover: 'lg:aspect-[21/9]', side: [] },
  1: { grid: 'lg:grid-cols-3 lg:grid-rows-1', cover: 'lg:col-span-2', side: [''] },
  2: { grid: 'lg:grid-cols-3 lg:grid-rows-2', cover: 'lg:col-span-2 lg:row-span-2', side: ['', ''] },
  3: { grid: 'lg:grid-cols-4 lg:grid-rows-2', cover: 'lg:col-span-2 lg:row-span-2', side: ['', '', 'lg:col-span-2'] },
  4: { grid: 'lg:grid-cols-4 lg:grid-rows-2', cover: 'lg:col-span-2 lg:row-span-2', side: ['', '', '', ''] },
}

export function TourGallery({ images, title }: { images: ImageAsset[]; title: string }) {
  if (!images.length) return null
  const [cover, ...rest] = images
  const side = rest.slice(0, 4)
  const layout = layouts[side.length]

  return (
    <div className={cn('grid gap-2 overflow-hidden rounded-md', side.length && 'lg:h-[28rem]', layout.grid)}>
      <div className={cn('relative aspect-[4/3] md:aspect-[16/9]', side.length && 'lg:aspect-auto', layout.cover)}>
        <Image
          src={cover.url}
          alt={cover.alt || title}
          fill
          preload
          sizes={side.length ? '(min-width: 1024px) 50vw, 100vw' : '100vw'}
          className="object-cover"
        />
      </div>
      {side.map((image, index) => (
        <div key={`${image.url}-${index}`} className={cn('relative hidden lg:block', layout.side[index])}>
          <Image src={image.url} alt={image.alt || title} fill sizes="25vw" className="object-cover" />
        </div>
      ))}
    </div>
  )
}
