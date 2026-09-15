import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PostCard } from '@/components/cards/PostCard'
import { PageHero } from '@/components/layout/PageHero'
import { Chip } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { Pagination } from '@/components/ui/Pagination'
import { getPathname } from '@/i18n/navigation'
import { getPostsPage } from '@/lib/data/queries'
import { firstParam, withQuery } from '@/lib/url'
import type { Post } from '@/payload-types'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const CATEGORIES: Post['category'][] = ['guide', 'news', 'promotion', 'press']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Blog' })
  return { title: t('title'), description: t('description'), alternates: { canonical: '/cam-nang' } }
}

export default async function BlogPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  setRequestLocale(locale)

  const rawCategory = firstParam(query['chuyen-muc'])
  const category = CATEGORIES.find((value) => value === rawCategory) ?? null
  const pageNumber = Math.max(1, Math.min(1000, Number.parseInt(firstParam(query.trang) ?? '1', 10) || 1))

  const [t, { posts, totalPages, page }] = await Promise.all([
    getTranslations('Blog'),
    getPostsPage({ category, page: pageNumber }, locale),
  ])
  const basePath = getPathname({ href: '/cam-nang', locale })

  return (
    <>
      <PageHero title={t('title')} description={t('description')} />
      <Container className="space-y-8 py-10 lg:py-14">
        <nav aria-label={t('categoriesLabel')} className="flex flex-wrap gap-2">
          <Chip href="/cam-nang" active={!category}>
            {t('all')}
          </Chip>
          {CATEGORIES.map((value) => (
            <Chip key={value} href={withQuery('/cam-nang', { 'chuyen-muc': value })} active={category === value}>
              {t(`categories.${value}`)}
            </Chip>
          ))}
        </nav>

        {posts.length ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-canvas-soft p-8 text-body-md text-ink">{t('empty')}</p>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(target) => withQuery(basePath, { 'chuyen-muc': category, trang: target > 1 ? target : null })}
        />
      </Container>
    </>
  )
}
