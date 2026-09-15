import { Award, BadgeCheck, Compass, Headset, ShieldCheck, Wallet } from 'lucide-react'
import Image from 'next/image'
import { draftMode } from 'next/headers'

import { HeroSlider, type HeroSlide } from '@/components/blocks/HeroSlider'
import { SearchBar } from '@/components/search/SearchBar'
import { ImageTile } from '@/components/cards/ImageTile'
import { NewsletterForm } from '@/components/forms/NewsletterForm'
import { PostCard } from '@/components/cards/PostCard'
import { ReviewCard } from '@/components/cards/ReviewCard'
import { TourCard } from '@/components/tour/TourCard'
import { Carousel } from '@/components/ui/Carousel'
import { containerClassName } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { isPopulated, toImage, visible } from '@/lib/data/mappers'
import { getActiveBanners, getApprovedReviews, getCarouselTours, getClients, getPosts } from '@/lib/data/queries'
import type {
  CategoryTilesBlock,
  ClientsBlock,
  DestinationGridBlock,
  HeroBannersBlock,
  NewsletterBlock,
  PostsBlock,
  PromoBannersBlock,
  ReviewsBlock,
  TourCarouselBlock,
  UspBlock,
} from '@/payload-types'

/* Section trang chủ. Section nào không có dữ liệu thì không hiện gì (không để khoảng trống). */

function viewAll(link?: { label?: string | null; href?: string | null } | null) {
  return link?.href ? { href: link.href, label: link.label } : null
}

export async function HeroBanners({ block, locale }: { block: HeroBannersBlock; locale: string }) {
  const banners = await getActiveBanners('hero', locale)
  const slides = banners.flatMap((banner): HeroSlide[] => {
    const desktop = toImage(banner.image, 'hero')
    if (!desktop) return []
    return [{ id: banner.id, href: banner.href, desktop, mobile: toImage(banner.mobileImage, 'card') ?? desktop }]
  })
  const showSearch = block.showSearch ?? true
  if (!slides.length && !showSearch) return null

  return (
    <div>
      {slides.length ? <HeroSlider slides={slides} /> : null}
      {showSearch ? (
        <div className={cn(containerClassName, slides.length ? 'mt-5 lg:mt-6' : 'pt-8')}>
          <SearchBar variant="hero" placeholder={block.searchPlaceholder} className="mx-auto max-w-3xl" />
        </div>
      ) : null}
    </div>
  )
}

const uspIcons = {
  support: Headset,
  quality: BadgeCheck,
  variety: Compass,
  price: Wallet,
  safety: ShieldCheck,
  experience: Award,
} as const

export function Usp({ block }: { block: UspBlock }) {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <div className="space-y-8">
      {block.title ? <SectionHeader title={block.title} /> : null}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = uspIcons[item.icon]
          return (
            <li key={item.id ?? index} className="flex gap-4 rounded-md bg-canvas-soft p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-canvas text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <span>
                <span className="block font-display text-body-md font-semibold text-ink">{item.title}</span>
                {item.description ? <span className="mt-1 block text-body-sm text-body">{item.description}</span> : null}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export async function PromoBanners({ block, locale }: { block: PromoBannersBlock; locale: string }) {
  const banners = await getActiveBanners('promo', locale)
  const items = banners.flatMap((banner) => {
    const image = toImage(banner.image, 'card')
    return image ? [{ id: banner.id, href: banner.href, image }] : []
  })
  if (!items.length) return null

  return (
    <div className="space-y-6">
      {block.title ? <SectionHeader title={block.title} action={viewAll(block.viewAll)} /> : null}
      <Carousel label={block.title || 'Khuyến mãi'} slideClassName="basis-[85%] sm:basis-1/2 lg:basis-1/3">
        {items.map((item) => {
          const image = (
            <Image
              src={item.image.url}
              alt={item.image.alt}
              fill
              sizes="(min-width: 1024px) 33vw, 85vw"
              className="object-cover transition-transform duration-(--duration-zoom) ease-brand group-hover:scale-105"
            />
          )
          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="group relative block aspect-[2/1] overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {image}
            </Link>
          ) : (
            <div key={item.id} className="group relative aspect-[2/1] overflow-hidden rounded-md">
              {image}
            </div>
          )
        })}
      </Carousel>
    </div>
  )
}

export async function TourCarousel({ block, locale }: { block: TourCarouselBlock; locale: string }) {
  const tours = await getCarouselTours(block, locale)
  if (!tours.length) return null

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={block.eyebrow}
        title={block.title}
        description={block.description}
        action={viewAll(block.viewAll)}
      />
      <Carousel label={block.title}>
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </Carousel>
    </div>
  )
}

export function CategoryTiles({ block }: { block: CategoryTilesBlock }) {
  const categories = block.categories.filter(isPopulated)
  if (!categories.length) return null

  return (
    <div className="space-y-6">
      {block.title ? <SectionHeader title={block.title} /> : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <li key={category.id}>
            <ImageTile
              href={`/danh-muc/${category.slug}`}
              title={category.name}
              image={toImage(category.coverImage, 'thumbnail')}
              sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
              className="aspect-square"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

// Lưới mosaic 12 cột: độ rộng xen kẽ để không đều tăm tắp.
const mosaicSpans = [
  'lg:col-span-5',
  'lg:col-span-4',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-4',
  'lg:col-span-5',
]

export async function DestinationGrid({ block }: { block: DestinationGridBlock }) {
  const { isEnabled } = await draftMode()
  const destinations = visible(block.destinations, isEnabled).slice(0, 6)
  if (!destinations.length) return null

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow={block.eyebrow} title={block.title} action={viewAll(block.viewAll)} />
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:gap-4">
        {destinations.map((destination, index) => (
          <li key={destination.id} className={cn('col-span-1', mosaicSpans[index])}>
            <ImageTile
              href={`/diem-den/${destination.slug}`}
              title={destination.name}
              subtitle={destination.summary}
              image={toImage(destination.coverImage, 'card')}
              sizes="(min-width: 1024px) 40vw, 50vw"
              className="aspect-[4/5] lg:aspect-auto lg:h-64"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export async function Reviews({ block, locale }: { block: ReviewsBlock; locale: string }) {
  const reviews = await getApprovedReviews(block.limit ?? 8, locale)
  if (!reviews.length) return null

  return (
    <div className="space-y-6">
      <SectionHeader title={block.title} action={viewAll(block.viewAll)} />
      <Carousel label={block.title} slideClassName="basis-[85%] sm:basis-1/2 lg:basis-1/3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </Carousel>
    </div>
  )
}

export async function Clients({ block, locale }: { block: ClientsBlock; locale: string }) {
  const clients = await getClients(locale)
  const items = clients.flatMap((client) => {
    const logo = toImage(client.logo, 'thumbnail')
    return logo ? [{ ...client, logo }] : []
  })
  if (!items.length) return null

  return (
    <div className="space-y-6">
      {block.title ? <SectionHeader title={block.title} /> : null}
      <ul className="flex flex-wrap items-center gap-x-10 gap-y-6">
        {items.map((client) => {
          const logo = (
            <Image
              src={client.logo.url}
              alt={client.name}
              width={160}
              height={64}
              className="h-12 w-auto object-contain opacity-70 grayscale transition-[filter,opacity] duration-(--duration-base) hover:opacity-100 hover:grayscale-0"
            />
          )
          return (
            <li key={client.id}>
              {client.href ? (
                <Link href={client.href} className="block rounded-sm focus-visible:outline-2 focus-visible:outline-primary">
                  {logo}
                </Link>
              ) : (
                logo
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Newsletter({ block }: { block: NewsletterBlock }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 rounded-md bg-canvas-soft p-6 md:p-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center">
      <div className="space-y-2">
        <h2 className="font-display text-display-sub-sm font-semibold text-balance text-ink md:text-display-md">{block.title}</h2>
        {block.description ? <p className="text-body-md text-body">{block.description}</p> : null}
      </div>
      <NewsletterForm buttonLabel={block.buttonLabel} successMessage={block.successMessage} />
    </div>
  )
}

export async function Posts({ block, locale }: { block: PostsBlock; locale: string }) {
  const posts = await getPosts({ category: block.category, limit: block.limit ?? 4 }, locale)
  if (!posts.length) return null

  return (
    <div className="space-y-6">
      <SectionHeader title={block.title} action={viewAll(block.viewAll)} />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
