import Image from 'next/image'

import { Container } from '@/components/ui/Container'
import type { ImageAsset } from '@/types/content'

type PageHeroProps = {
  title: string
  description?: string | null
  eyebrow?: string | null
  image?: ImageAsset | null
}

/** Đầu trang danh mục, điểm đến, trang tĩnh. Có ảnh thì chữ trắng trên ảnh phủ tối. */
export function PageHero({ title, description, eyebrow, image }: PageHeroProps) {
  if (image) {
    return (
      <section className="relative isolate overflow-hidden bg-ink">
        <Image src={image.url} alt="" fill preload sizes="100vw" className="-z-10 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink/85 via-ink/45 to-ink/10" />
        <Container className="flex min-h-64 flex-col justify-end gap-3 py-10 lg:min-h-80 lg:py-14">
          {eyebrow ? (
            <p className="font-display text-caption font-medium tracking-[1px] text-canvas-soft uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-display-md font-semibold text-balance text-on-primary lg:text-display-lg">
            {title}
          </h1>
          {description ? <p className="max-w-2xl text-body-lg text-canvas-soft">{description}</p> : null}
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-canvas-soft">
      <Container className="space-y-3 py-10 lg:py-14">
        {eyebrow ? <p className="font-display text-caption font-medium tracking-[1px] text-body uppercase">{eyebrow}</p> : null}
        <h1 className="font-display text-display-md font-semibold text-balance text-ink lg:text-display-lg">{title}</h1>
        {description ? <p className="max-w-2xl text-body-lg text-body">{description}</p> : null}
      </Container>
    </section>
  )
}
