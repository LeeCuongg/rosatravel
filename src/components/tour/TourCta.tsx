import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'

export function TourCta({ slug }: { slug: string }) {
  const t = useTranslations('cta')

  return (
    <section className="mx-auto max-w-3xl px-6 pb-(--spacing-section) text-center">
      <Reveal>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
          {t('tourHeadline')}
        </h2>
        <p className="mt-3 text-ink-500">{t('tourSub')}</p>
        {/* ?tour=<slug> được ContactForm đọc để chọn sẵn tour trong dropdown. */}
        <Link
          href={`/lien-he?tour=${slug}`}
          className="mt-8 inline-block rounded-full bg-clay-500 px-8 py-3 font-medium transition-transform duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:scale-105"
        >
          {t('bookNow')}
        </Link>
      </Reveal>
    </section>
  )
}
