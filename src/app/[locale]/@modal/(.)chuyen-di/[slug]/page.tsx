import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getCaseStudy, getCaseStudySlugs } from '@/lib/content'
import { CaseArticle } from '@/components/case/CaseArticle'
import { CaseOverlay } from '@/components/case/CaseOverlay'
import { routing, type Locale } from '@/i18n/routing'

/**
 * BẢN LỚP PHỦ của bài "Chuyến đã đi" — intercepting route.
 *
 * Tiền tố `(.)` trong tên thư mục bảo Next: khi người dùng điều hướng phía
 * client tới /[locale]/chuyen-di/<slug>, hãy chặn lại và render file này vào
 * khe `@modal` của layout, thay vì thay thế cả trang. Trang chủ vẫn còn nguyên
 * phía sau, kể cả vị trí cuộn.
 *
 * Việc chặn CHỈ xảy ra với điều hướng phía client (bấm <Link>). Gõ thẳng URL,
 * mở tab mới, hoặc nhấn F5 thì không có gì để chặn và Next render trang đầy đủ
 * ở src/app/[locale]/chuyen-di/[slug]/page.tsx. Hai file, một nội dung — đó là
 * lý do CaseArticle phải là component riêng.
 *
 * KHÔNG khai generateMetadata ở đây: thẻ meta của URL này thuộc về trang đầy
 * đủ. Lớp phủ chỉ là một cách trình bày, và khi nó đang mở thì thẻ meta trên
 * <head> vẫn là của trang chủ — đúng như vậy, vì đó mới là trang thật sự đang
 * được xem.
 */

type Params = Promise<{ locale: Locale; slug: string }>

export async function generateStaticParams() {
  const slugs = await getCaseStudySlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export default async function CaseStudyModal({ params }: { params: Params }) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const caseStudy = await getCaseStudy(slug)
  if (!caseStudy) notFound()

  return (
    <CaseOverlay
      title={caseStudy.title[locale] ?? caseStudy.title.vi}
      subtitle={caseStudy.subtitle[locale] ?? caseStudy.subtitle.vi}
      accent={caseStudy.accent}
    >
      {/* laTrangDayDu={false}: xem giải thích ở CaseArticle — trong lớp phủ,
          ảnh đầu bài không phải LCP và không đáng preload từ trang chủ. */}
      <CaseArticle caseStudy={caseStudy} locale={locale} laTrangDayDu={false} />
    </CaseOverlay>
  )
}
