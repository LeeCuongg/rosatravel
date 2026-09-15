import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import type { Home, Page, Tour } from '@/payload-types'

import {
  Faq,
  Gallery,
  Highlights,
  Inclusions,
  Itinerary,
  Notes,
  Policy,
  PriceTable,
  RichTextContent,
  Video,
} from './ContentBlocks'
import {
  CategoryTiles,
  Clients,
  DestinationGrid,
  HeroBanners,
  Newsletter,
  Posts,
  PromoBanners,
  Reviews,
  TourCarousel,
  Usp,
} from './HomeBlocks'
import { containerClassName } from '@/components/ui/Container'

export type AnyBlock =
  | NonNullable<Home['layout']>[number]
  | NonNullable<Tour['layout']>[number]
  | NonNullable<Page['layout']>[number]

function renderBlock(block: AnyBlock, locale: string): ReactNode {
  switch (block.blockType) {
    case 'highlights':
      return <Highlights block={block} />
    case 'itinerary':
      return <Itinerary block={block} />
    case 'inclusions':
      return <Inclusions block={block} />
    case 'priceTable':
      return <PriceTable block={block} />
    case 'policy':
      return <Policy block={block} />
    case 'notes':
      return <Notes block={block} />
    case 'faq':
      return <Faq block={block} />
    case 'gallery':
      return <Gallery block={block} />
    case 'video':
      return <Video block={block} />
    case 'richText':
      return <RichTextContent block={block} />
    case 'heroBanners':
      return <HeroBanners block={block} locale={locale} />
    case 'usp':
      return <Usp block={block} />
    case 'promoBanners':
      return <PromoBanners block={block} locale={locale} />
    case 'tourCarousel':
      return <TourCarousel block={block} locale={locale} />
    case 'categoryTiles':
      return <CategoryTiles block={block} />
    case 'destinationGrid':
      return <DestinationGrid block={block} />
    case 'reviews':
      return <Reviews block={block} locale={locale} />
    case 'clients':
      return <Clients block={block} locale={locale} />
    case 'posts':
      return <Posts block={block} locale={locale} />
    case 'newsletter':
      return <Newsletter block={block} />
    default:
      return null
  }
}

type RenderBlocksProps = {
  blocks: AnyBlock[] | null | undefined
  locale: string
  /**
   * `sections`: mỗi khối là một section full trang (trang chủ, trang tĩnh).
   * `stack`: xếp dọc trong một cột (nội dung trang tour).
   */
  variant?: 'sections' | 'stack'
}

export function RenderBlocks({ blocks, locale, variant = 'sections' }: RenderBlocksProps) {
  if (!blocks?.length) return null

  return blocks.map((block, index) => {
    const content = renderBlock(block, locale)
    if (!content) return null
    const key = block.id ?? `${block.blockType}-${index}`

    // `empty:hidden`: khối không có dữ liệu trả về rỗng thì không để lại khoảng trắng.
    if (variant === 'stack') {
      return (
        <div key={key} className="empty:hidden">
          {content}
        </div>
      )
    }

    const fullBleed = block.blockType === 'heroBanners'
    return (
      <section key={key} className={cn('empty:hidden', fullBleed ? 'pb-6 lg:pb-10' : cn(containerClassName, 'py-10 lg:py-14'))}>
        {content}
      </section>
    )
  })
}
