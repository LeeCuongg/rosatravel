import { setRequestLocale } from 'next-intl/server'
import { getHomeContent, getTours } from '@/lib/content'
import { HeroCinematic } from '@/components/home/HeroCinematic'
import { WhyUs } from '@/components/home/WhyUs'
import { TourGrid } from '@/components/home/TourGrid'
import { JourneyCinematic } from '@/components/home/JourneyCinematic'
import { Testimonials } from '@/components/home/Testimonials'
import { FinalCta } from '@/components/home/FinalCta'
import type { Locale } from '@/i18n/routing'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const home = await getHomeContent()
  const allTours = await getTours()
  const featured = home.featuredTourSlugs
    .map((slug) => allTours.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  return (
    <main>
      <HeroCinematic hero={home.hero} locale={locale} />
      <WhyUs items={home.whyUs} locale={locale} />
      <TourGrid tours={featured} locale={locale} />
      <JourneyCinematic journey={home.journey} locale={locale} />
      <Testimonials items={home.testimonials} locale={locale} />
      <FinalCta contact={home.contact} />
    </main>
  )
}
