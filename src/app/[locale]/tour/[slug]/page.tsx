import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getTour, getTourSlugs, getTours } from '@/lib/content'
import { TourHero } from '@/components/tour/TourHero'
import { ItineraryCinematic } from '@/components/tour/ItineraryCinematic'
import { Gallery } from '@/components/tour/Gallery'
import { InclusionList } from '@/components/tour/InclusionList'
import { TourCta } from '@/components/tour/TourCta'
import { RelatedTours } from '@/components/tour/RelatedTours'
import { Eyebrow } from '@/components/ui/Frame'
import { LocationDrawer } from '@/components/location/LocationDrawer'
import { gomDiaDiem } from '@/components/location/gom-dia-diem'
import { Reveal } from '@/components/motion/Reveal'
import { routing, type Locale } from '@/i18n/routing'

type Params = Promise<{ locale: Locale; slug: string }>

export async function generateStaticParams() {
  const slugs = await getTourSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const tour = await getTour(slug)
  if (!tour) return {}

  const title = tour.seo.title[locale] ?? tour.seo.title.vi
  const description = tour.seo.description[locale] ?? tour.seo.description.vi

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: tour.seo.ogImage.src, width: 1200, height: 630 }],
      type: 'article',
    },
  }
}

export default async function TourPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('sections')

  // Hai truy vấn chạy song song: danh sách tour cho khối "Hành trình khác"
  // không phụ thuộc vào tour đang xem, nên chờ tuần tự là phí đúng một vòng
  // round-trip tới database ở MỌI trang tour được sinh ra lúc build.
  const [tour, allTours] = await Promise.all([getTour(slug), getTours()])
  if (!tour) notFound()

  return (
    <main>
      <TourHero tour={tour} locale={locale} />
      <section className="mx-auto max-w-sml px-gutter my-section text-center">
        <Reveal>
          <Eyebrow>{t('tourStory')}</Eyebrow>
          {/* Tóm tắt để cỡ d3 bằng chữ serif, KHÔNG phải cỡ thân bài: đây là
              đoạn duy nhất trên trang có nhiệm vụ thuyết phục, phần còn lại
              (lịch trình, bao gồm) là thông tin tra cứu. */}
          <p className="font-display mt-6 text-d3">{tour.summary[locale] ?? tour.summary.vi}</p>
        </Reveal>
      </section>
      <ItineraryCinematic days={tour.itinerary} locale={locale} />
      <Gallery images={tour.gallery} locale={locale} />
      <InclusionList inclusions={tour.inclusions} exclusions={tour.exclusions} locale={locale} />
      <TourCta slug={tour.slug} />
      <RelatedTours tours={allTours} currentSlug={tour.slug} locale={locale} />

      {/* Cùng ngăn kéo với bài "Chuyến đã đi". Địa điểm trong lịch trình tour
          đã được nạp sẵn ở server (depth 2), nên mở ra là thấy ngay. */}
      <Suspense>
        <LocationDrawer locations={gomDiaDiem(tour.itinerary)} locale={locale} />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Thoát '<' thành <: nội dung tour (mô tả, tiêu đề) đến từ content
          // JSON, không phải hằng số. Một mô tả chứa chuỗi "</script>" sẽ đóng
          // sớm thẻ script này và làm vỡ phần còn lại của trang nếu không thoát.
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            name: tour.title[locale] ?? tour.title.vi,
            description: tour.summary[locale] ?? tour.summary.vi,
            touristType: 'Leisure',
            itinerary: tour.itinerary.map((day) => ({
              '@type': 'Place',
              name: day.title[locale] ?? day.title.vi,
            })),
            offers: {
              '@type': 'Offer',
              price: tour.priceFrom,
              priceCurrency: tour.currency,
            },
          }).replace(/</g, '\\u003c'),
        }}
      />
    </main>
  )
}
