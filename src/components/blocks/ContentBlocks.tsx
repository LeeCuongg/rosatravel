import { Check, X } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { RichText } from '@/components/rich-text/RichText'
import { toImage } from '@/lib/data/mappers'
import { formatVnd } from '@/lib/format'
import { youtubeId } from '@/lib/video'
import type {
  FaqBlock,
  GalleryBlock,
  HighlightsBlock,
  InclusionsBlock,
  ItineraryBlock,
  NotesBlock,
  PolicyBlock,
  PriceTableBlock,
  RichTextBlock,
  VideoBlock,
} from '@/payload-types'
import type { ImageAsset } from '@/types/content'

/* Khối nội dung trang tour và trang tĩnh. Tiêu đề để trống trong admin thì dùng nhãn mặc định. */

function BlockTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-display-sub-sm font-semibold text-balance text-ink md:text-display-md">
      {children}
    </h2>
  )
}

function images(values: Parameters<typeof toImage>[0][] | null | undefined, size: 'card' | 'hero' = 'card'): ImageAsset[] {
  return (values ?? []).map((value) => toImage(value, size)).filter((image): image is ImageAsset => image !== null)
}

export async function Highlights({ block }: { block: HighlightsBlock }) {
  const items = block.items ?? []
  if (!items.length) return null
  const t = await getTranslations('Blocks')

  return (
    <div className="space-y-5">
      <BlockTitle>{block.title || t('highlights')}</BlockTitle>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.id ?? index} className="flex gap-3 rounded-md bg-canvas-soft p-4 text-body-sm text-ink">
            <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

export async function Itinerary({ block }: { block: ItineraryBlock }) {
  const days = block.days ?? []
  if (!days.length) return null
  const t = await getTranslations('Blocks')

  return (
    <div className="space-y-6">
      <BlockTitle>{block.title || t('itinerary')}</BlockTitle>
      <ol className="space-y-8">
        {days.map((day, index) => {
          const dayImages = images(day.images)
          return (
            <li key={day.id ?? index} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-pill bg-primary font-display text-body-sm font-semibold text-on-primary"
              >
                {index + 1}
              </span>
              <div className="space-y-3">
                <div>
                  <p className="font-display text-caption font-medium tracking-[1px] text-primary uppercase">
                    {t('day', { day: index + 1 })}
                  </p>
                  <h3 className="font-display text-display-xs font-semibold text-ink">{day.title}</h3>
                  {day.meals?.length ? (
                    <p className="mt-1 text-caption text-body-mid">
                      {t('meals')}: {day.meals.map((meal) => t(`meal.${meal}`)).join(' · ')}
                    </p>
                  ) : null}
                </div>
                <RichText data={day.content} />
                {dayImages.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {dayImages.map((image, imageIndex) => (
                      <div key={`${image.url}-${imageIndex}`} className="relative aspect-[4/3] overflow-hidden rounded-md">
                        <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 18vw, 45vw" className="object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export async function Inclusions({ block }: { block: InclusionsBlock }) {
  const included = block.included ?? []
  const excluded = block.excluded ?? []
  if (!included.length && !excluded.length) return null
  const t = await getTranslations('Blocks')

  return (
    <div className="space-y-5">
      {block.title ? <BlockTitle>{block.title}</BlockTitle> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {included.length ? (
          <div className="space-y-3 rounded-md bg-canvas-soft p-5">
            <h3 className="font-display text-display-xs font-semibold text-ink">{t('included')}</h3>
            <ul className="space-y-2 text-body-sm text-ink">
              {included.map((item, index) => (
                <li key={item.id ?? index} className="flex gap-2">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {excluded.length ? (
          <div className="space-y-3 rounded-md border border-mute/60 p-5">
            <h3 className="font-display text-display-xs font-semibold text-ink">{t('excluded')}</h3>
            <ul className="space-y-2 text-body-sm text-ink">
              {excluded.map((item, index) => (
                <li key={item.id ?? index} className="flex gap-2">
                  <X aria-hidden className="mt-0.5 size-4 shrink-0 text-error" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export async function PriceTable({ block }: { block: PriceTableBlock }) {
  const rows = block.rows ?? []
  if (!rows.length) return null
  const t = await getTranslations('Blocks')
  const hasNotes = rows.some((row) => row.note)

  return (
    <div className="space-y-5">
      <BlockTitle>{block.title || t('priceTable')}</BlockTitle>
      <div className="overflow-x-auto rounded-md border border-mute/60">
        <table className="w-full min-w-[28rem] text-left text-body-sm">
          <thead className="bg-canvas-soft text-caption font-semibold tracking-[0.5px] text-body uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">{t('priceColumns.label')}</th>
              <th scope="col" className="px-4 py-3 text-right">{t('priceColumns.price')}</th>
              {hasNotes ? <th scope="col" className="px-4 py-3">{t('priceColumns.note')}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-mute/60">
            {rows.map((row, index) => (
              <tr key={row.id ?? index}>
                <th scope="row" className="px-4 py-3 font-semibold text-ink">{row.label}</th>
                <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-primary">
                  {typeof row.price === 'number' ? formatVnd(row.price) : t('contactForPrice')}
                </td>
                {hasNotes ? <td className="px-4 py-3 text-body">{row.note}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RichText data={block.footnote} className="text-body-sm" />
    </div>
  )
}

export function Policy({ block }: { block: PolicyBlock }) {
  return (
    <div className="space-y-4 rounded-md border border-mute/60 p-5 lg:p-6">
      <h2 className="font-display text-display-xs font-semibold text-ink">{block.title}</h2>
      <RichText data={block.content} className="text-body-sm" />
    </div>
  )
}

export async function Notes({ block }: { block: NotesBlock }) {
  const t = await getTranslations('Blocks')
  return (
    <div className="space-y-4 rounded-md bg-canvas-soft p-5 lg:p-6">
      <h2 className="font-display text-display-xs font-semibold text-ink">{block.title || t('notes')}</h2>
      <RichText data={block.content} className="text-body-sm" />
    </div>
  )
}

export async function Faq({ block }: { block: FaqBlock }) {
  const items = block.items ?? []
  if (!items.length) return null
  const t = await getTranslations('Blocks')

  return (
    <div className="space-y-5">
      <BlockTitle>{block.title || t('faq')}</BlockTitle>
      <div className="divide-y divide-mute/60 rounded-md border border-mute/60">
        {items.map((item, index) => (
          <details key={item.id ?? index} className="faq-item group px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden
                className="text-display-xs leading-none text-primary transition-transform duration-(--duration-base) ease-brand group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <RichText data={item.answer} className="pb-5 text-body-sm" />
          </details>
        ))}
      </div>
    </div>
  )
}

export async function Gallery({ block }: { block: GalleryBlock }) {
  const galleryImages = images(block.images)
  if (!galleryImages.length) return null
  const t = await getTranslations('Blocks')

  return (
    <div className="space-y-5">
      <BlockTitle>{block.title || t('gallery')}</BlockTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {galleryImages.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="relative aspect-[4/3] overflow-hidden rounded-md first:col-span-2 first:row-span-2 first:aspect-auto md:first:aspect-auto"
          >
            <Image src={image.url} alt={image.alt} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

export async function Video({ block }: { block: VideoBlock }) {
  const id = youtubeId(block.url)
  if (!id) return null
  const t = await getTranslations('Blocks')
  const title = block.title || block.caption || t('video')

  return (
    <figure className="space-y-3">
      {block.title ? <BlockTitle>{block.title}</BlockTitle> : null}
      <div className="relative aspect-video overflow-hidden rounded-md bg-ink">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      </div>
      {block.caption ? <figcaption className="text-caption text-body">{block.caption}</figcaption> : null}
    </figure>
  )
}

export function RichTextContent({ block }: { block: RichTextBlock }) {
  return <RichText data={block.content} />
}
