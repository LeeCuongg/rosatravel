import Image from 'next/image'
import { useFormatter } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { toImage } from '@/lib/data/mappers'
import type { Post } from '@/payload-types'

export function PostCard({ post }: { post: Post }) {
  const format = useFormatter()
  const image = toImage(post.coverImage, 'card')

  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-canvas-soft">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 90vw"
            className="object-cover transition-transform duration-(--duration-zoom) ease-brand group-hover:scale-105"
          />
        ) : null}
      </div>
      {post.publishedAt ? (
        <time dateTime={post.publishedAt} className="text-caption text-body-mid">
          {format.dateTime(new Date(post.publishedAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </time>
      ) : null}
      <h3 className="line-clamp-2 font-display text-display-xs font-semibold text-ink">
        <Link
          href={`/cam-nang/${post.slug}`}
          className="after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-primary"
        >
          {post.title}
        </Link>
      </h3>
      {post.excerpt ? <p className="line-clamp-2 text-body-sm text-body">{post.excerpt}</p> : null}
    </article>
  )
}
