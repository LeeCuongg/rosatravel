'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Children, useCallback, useSyncExternalStore, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type CarouselProps = {
  children: ReactNode
  /** Tên băng chuyền cho trình đọc màn hình, vd. tiêu đề section. */
  label: string
  /** Độ rộng mỗi slide theo breakpoint. */
  slideClassName?: string
  className?: string
}

const noScroll = '00'

export function Carousel({
  children,
  label,
  slideClassName = 'basis-[82%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4',
  className,
}: CarouselProps) {
  const t = useTranslations('Common')
  const [viewportRef, api] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 'auto',
  })

  // Đọc trạng thái nút từ Embla qua useSyncExternalStore thay vì setState trong effect.
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
  const scrollState = useSyncExternalStore(
    subscribe,
    () => (api ? `${Number(api.canScrollPrev())}${Number(api.canScrollNext())}` : noScroll),
    () => noScroll,
  )
  const canPrev = scrollState[0] === '1'
  const canNext = scrollState[1] === '1'

  const slides = Children.toArray(children)

  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn('relative', className)}>
      <div ref={viewportRef} className="overflow-hidden">
        {/* pt-2: chừa chỗ cho thẻ nhấc lên khi hover mà không bị cắt. */}
        <div className="-ml-4 flex touch-pan-y lg:-ml-6">
          {slides.map((slide, index) => (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${slides.length}`}
              className={cn('min-w-0 shrink-0 grow-0 pt-2 pb-3 pl-4 lg:pl-6', slideClassName)}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {canPrev || canNext ? (
        <>
          <CarouselButton direction="prev" label={t('previous')} disabled={!canPrev} onClick={() => api?.scrollPrev()} />
          <CarouselButton direction="next" label={t('next')} disabled={!canNext} onClick={() => api?.scrollNext()} />
        </>
      ) : null}
    </section>
  )
}

function CarouselButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  label: string
  disabled: boolean
  onClick: () => void
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-pill border border-ink bg-canvas text-ink transition-[background-color,color,opacity] duration-(--duration-fast) ease-brand hover:bg-ink hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0 lg:flex',
        direction === 'prev' ? '-left-5' : '-right-5',
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  )
}
