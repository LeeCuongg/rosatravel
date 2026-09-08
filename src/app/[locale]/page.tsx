import { setRequestLocale } from 'next-intl/server'
import { getCaseStudies, getHomeContent, getTours, isVideoAsset } from '@/lib/content'
import { HeroEditorial, gomAnhCollage } from '@/components/home/HeroEditorial'
import { WhyUs } from '@/components/home/WhyUs'
import { TourGrid } from '@/components/home/TourGrid'
import { JourneyCinematic } from '@/components/home/JourneyCinematic'
import { CaseGrid } from '@/components/case/CaseGrid'
import { Testimonials } from '@/components/home/Testimonials'
import { Faq } from '@/components/home/Faq'
import { PlanTrip } from '@/components/home/PlanTrip'
import type { Locale } from '@/i18n/routing'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  // Ba truy vấn độc lập nhau — chờ tuần tự là phí hai vòng round-trip tới
  // database ở mỗi lần build trang chủ.
  const [home, allTours, caseStudies] = await Promise.all([
    getHomeContent(),
    getTours(),
    getCaseStudies(),
  ])
  const featured = home.featuredTourSlugs
    .map((slug) => allTours.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  // Ảnh bìa của các tour nổi bật được góp vào mảng ảnh hero. Lấy TẤT CẢ tour
  // chứ không chỉ tour nổi bật: mảng cần tối đa 10 ảnh khác nhau, và một site
  // mới thường chỉ có vài tour được đánh dấu nổi bật.
  const anhBiaTour = allTours.map((tour) =>
    isVideoAsset(tour.heroMedia) ? tour.heroMedia.poster : tour.heroMedia,
  )
  const anhCollage = gomAnhCollage(home.hero.media, home.journey.stops, anhBiaTour)

  const danhSachTourChoForm = allTours.map((tour) => ({
    slug: tour.slug,
    label: tour.title[locale] ?? tour.title.vi,
  }))

  return (
    <main>
      <HeroEditorial hero={home.hero} images={anhCollage} locale={locale} />
      <WhyUs items={home.whyUs} locale={locale} />
      <TourGrid tours={featured} locale={locale} />
      <CaseGrid cases={caseStudies} locale={locale} />
      <JourneyCinematic journey={home.journey} locale={locale} />
      <Testimonials items={home.testimonials} locale={locale} />
      <Faq items={home.faq} locale={locale} />
      <PlanTrip
        contact={home.contact}
        guide={home.guide}
        tours={danhSachTourChoForm}
        locale={locale}
      />
    </main>
  )
}
