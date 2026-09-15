import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { PostCard } from '@/components/cards/PostCard'
import { RichText } from '@/components/rich-text/RichText'
import { Badge } from '@/components/ui/Badge'
import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { toImage } from '@/lib/data/mappers'
import { getPostBySlug, getPosts, getSlugs } from '@/lib/data/queries'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  try {
    return (await getSlugs('posts')).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await getPostBySlug(slug, locale)
  if (!post) return {}

  const image = toImage(post.seo?.image, 'hero') ?? toImage(post.coverImage, 'hero')
  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt || undefined,
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
      ...(image ? { images: [{ url: image.url, alt: image.alt }] } : {}),
    },
    alternates: { canonical: `/cam-nang/${slug}` },
  }
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const post = await getPostBySlug(slug, locale)
  if (!post) notFound()

  const [t, format, sameCategory] = await Promise.all([
    getTranslations('Blog'),
    getFormatter(),
    getPosts({ category: post.category, limit: 4 }, locale),
  ])
  const related = sameCategory.filter((item) => item.id !== post.id).slice(0, 3)
  const cover = toImage(post.coverImage, 'hero')

  return (
    <>
      <article>
        <Container className="max-w-3xl space-y-5 pt-10 lg:pt-14">
          <div className="flex flex-wrap items-center gap-3 text-caption text-body">
            <Badge>{t(`categories.${post.category}`)}</Badge>
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>
                {format.dateTime(new Date(post.publishedAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </time>
            ) : null}
          </div>
          <h1 className="font-display text-display-md font-semibold text-balance text-ink lg:text-display-lg">{post.title}</h1>
          {post.excerpt ? <p className="text-body-lg text-body">{post.excerpt}</p> : null}
        </Container>

        {cover ? (
          <Container className="max-w-5xl pt-8">
            <div className="relative aspect-[16/9] overflow-hidden rounded-md">
              <Image src={cover.url} alt={cover.alt} fill preload sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
            </div>
          </Container>
        ) : null}

        <Container className="max-w-3xl space-y-8 py-10 lg:py-14">
          <RichText data={post.content} />
          {post.category === 'press' && post.sourceUrl ? (
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-ink underline underline-offset-4 hover:text-primary"
            >
              {t('source')}
              <ExternalLink aria-hidden className="size-4" />
            </a>
          ) : null}
        </Container>
      </article>

      {related.length ? (
        <section className="border-t border-mute/60 py-12 lg:py-16">
          <Container className="space-y-6">
            <SectionHeader title={t('related')} action={{ href: '/cam-nang' }} />
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  )
}
