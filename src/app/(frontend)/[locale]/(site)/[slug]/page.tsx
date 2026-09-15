import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { PageHero } from '@/components/layout/PageHero'
import { toImage } from '@/lib/data/mappers'
import { getPageBySlug, getSlugs } from '@/lib/data/queries'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

// Trang tĩnh do nhân viên tạo trong admin (giới thiệu, chính sách…).
// Các route cố định (/tour, /danh-muc, /lien-he…) được Next ưu tiên trước route này.
export async function generateStaticParams() {
  try {
    return (await getSlugs('pages')).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const page = await getPageBySlug(slug, locale)
  if (!page) return {}

  const image = toImage(page.seo?.image, 'hero')
  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || undefined,
    openGraph: image ? { images: [{ url: image.url, alt: image.alt }] } : undefined,
    alternates: { canonical: `/${slug}` },
  }
}

export default async function StaticPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const page = await getPageBySlug(slug, locale)
  if (!page) notFound()

  return (
    <>
      <PageHero title={page.title} />
      <RenderBlocks blocks={page.layout} locale={locale} />
    </>
  )
}
