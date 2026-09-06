import { setRequestLocale } from 'next-intl/server'
import { getHomeContent } from '@/lib/content'
import { HeroCinematic } from '@/components/home/HeroCinematic'
import type { Locale } from '@/i18n/routing'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const home = await getHomeContent()

  return (
    <main>
      <HeroCinematic hero={home.hero} locale={locale} />
      <div className="h-screen" />
    </main>
  )
}
