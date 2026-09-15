'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageProps } from 'next/image'
import { useTranslations } from 'next-intl'
import { useCallback, useSyncExternalStore, type ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import type { ImageAsset } from '@/types/content'

export type HeroSlide = {
  id: string
  href?: string | null
  desktop: ImageAsset
  mobile: ImageAsset
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const t = useTranslations('Common')
  const [viewportRef, api] = useEmblaCarousel({ loop: slides.length > 1 })

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!api) return () => {}
      api.on('select', onChange).on('reInit', onChange)
      return () => {
        api.off('select', onChange).off('reInit', onChange)
      }
    },
    [api],
  )
  const selected = useSyncExternalStore(subscribe, () => api?.selectedScrollSnap() ?? 0, () => 0)

  return (
    <div aria-roledescription="carousel" aria-label={t('heroLabel')} className="relative mx-auto w-full max-w-7xl lg:px-8 lg:pt-6">
      <div ref={viewportRef} className="overflow-hidden lg:rounded-md">
        <div className="flex">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${slides.length}`}
              className="relative aspect-[4/3] min-w-0 shrink-0 grow-0 basis-full md:aspect-[21/9]"
            >
              <SlideLink href={slide.href}>
                <HeroPicture slide={slide} preload={index === 0} />
              </SlideLink>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={t('goToSlide', { index: index + 1 })}
                aria-current={index === selected ? 'true' : undefined}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  'h-2 rounded-pill transition-[width,background-color] duration-(--duration-slow) ease-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas',
                  index === selected ? 'w-6 bg-primary' : 'w-2 bg-canvas/80 hover:bg-canvas',
                )}
              />
            ))}
          </div>
          <HeroArrow direction="prev" label={t('previous')} onClick={() => api?.scrollPrev()} />
          <HeroArrow direction="next" label={t('next')} onClick={() => api?.scrollNext()} />
        </>
      ) : null}
    </div>
  )
}

const desktopSizes = '(min-width: 1280px) 1216px, 100vw'

/**
 * Ảnh điện thoại và máy tính khác nhau (art direction): dùng <picture> để trình
 * duyệt chỉ tải đúng một ảnh, thay vì hai <Image> ẩn/hiện bằng CSS (vẫn tải cả hai).
 * Cách làm theo tài liệu Next: getImageProps.
 */
function HeroPicture({ slide, preload }: { slide: HeroSlide; preload: boolean }) {
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ src: slide.desktop.url, alt: slide.desktop.alt, fill: true, sizes: desktopSizes, preload })
  const {
    props: { srcSet: mobileSrcSet, ...imageProps },
  } = getImageProps({ src: slide.mobile.url, alt: slide.mobile.alt, fill: true, sizes: '100vw', preload })

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes={desktopSizes} />
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
      <img {...imageProps} alt={imageProps.alt} className="object-cover" />
    </picture>
  )
}

function SlideLink({ href, children }: { href?: string | null; children: ReactNode }) {
  if (!href) return <div className="absolute inset-0">{children}</div>
  return (
    <Link href={href} className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary">
      {children}
    </Link>
  )
}

function HeroArrow({ direction, label, onClick }: { direction: 'prev' | 'next'; label: string; onClick: () => void }) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-pill bg-canvas/90 text-ink shadow-panel transition-colors duration-(--duration-fast) hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:flex',
        direction === 'prev' ? 'left-12' : 'right-12',
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  )
}
