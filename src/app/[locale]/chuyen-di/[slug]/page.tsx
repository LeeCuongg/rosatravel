import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCaseStudies, getCaseStudy, getCaseStudySlugs } from '@/lib/content'
import { CaseArticle } from '@/components/case/CaseArticle'
import { Frame } from '@/components/ui/Frame'
import { TextLink } from '@/components/ui/TextLink'
import { routing, type Locale } from '@/i18n/routing'

/**
 * Trang ĐẦY ĐỦ của một bài "Chuyến đã đi".
 *
 * Đây là trang thật, không phải bản dự phòng. Nó phục vụ ba tình huống mà lớp
 * phủ không làm được: mở thẳng link ai đó gửi, tải lại trang khi lớp phủ đang
 * mở, và trình thu thập của công cụ tìm kiếm. Lớp phủ chỉ là một cách trình
 * bày KHÁC của cùng nội dung này khi người đọc tới từ trang chủ.
 */

type Params = Promise<{ locale: Locale; slug: string }>

export async function generateStaticParams() {
  const slugs = await getCaseStudySlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const caseStudy = await getCaseStudy(slug)
  if (!caseStudy) return {}

  const title = caseStudy.seo.title[locale] ?? caseStudy.seo.title.vi
  const description = caseStudy.seo.description[locale] ?? caseStudy.seo.description.vi

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: caseStudy.seo.ogImage.src, width: 1200, height: 630 }],
      type: 'article',
    },
  }
}

export default async function CaseStudyPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('sections')

  // Song song: danh sách bài khác không phụ thuộc vào bài đang xem.
  const [caseStudy, all] = await Promise.all([getCaseStudy(slug), getCaseStudies()])
  if (!caseStudy) notFound()

  const khac = all.filter((c) => c.slug !== caseStudy.slug).slice(0, 3)

  return (
    <main>
      <CaseArticle caseStudy={caseStudy} locale={locale} />

      {khac.length > 0 && (
        <Frame label={t('otherCaseStudies')} width="sml" bodyClassName="">
          <ul className="divide-y divide-dashed divide-rule">
            {khac.map((item) => (
              <li key={item.slug} className="px-6 py-6 sm:px-10">
                <TextLink href={`/chuyen-di/${item.slug}`} size="md">
                  {item.title[locale] ?? item.title.vi}
                </TextLink>
                <p className="mt-2 text-meta text-ink-500">
                  {item.subtitle[locale] ?? item.subtitle.vi}
                </p>
              </li>
            ))}
          </ul>
        </Frame>
      )}
    </main>
  )
}
