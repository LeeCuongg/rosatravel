import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getTours } from '@/lib/content'
import { ContactForm } from '@/components/contact/ContactForm'
import type { Locale } from '@/i18n/routing'

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')
  const tours = (await getTours()).map((tour) => ({
    slug: tour.slug,
    label: tour.title[locale] ?? tour.title.vi,
  }))

  return (
    <main className="mx-auto max-w-xl px-6 pb-(--spacing-section) pt-40">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl">{t('title')}</h1>
      {/* useSearchParams cần Suspense để trang vẫn sinh tĩnh được. */}
      <Suspense>
        <div className="mt-10">
          <ContactForm tours={tours} />
        </div>
      </Suspense>
    </main>
  )
}
