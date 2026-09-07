import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import type { HomeContent } from '@/lib/content'

export function FinalCta({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('cta')

  return (
    <section className="mx-auto max-w-3xl px-6 py-(--spacing-section) text-center">
      <Reveal>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl">
          {t('finalHeadline')}
        </h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/lien-he"
            className="rounded-full bg-clay-600 px-8 py-3 font-medium transition-transform duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:scale-105"
          >
            {t('bookNow')}
          </Link>
          <a
            href={`tel:${contact.phone}`}
            className="rounded-full border border-ink-700 px-8 py-3 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:border-sand-400"
          >
            {t('callUs')}
          </a>
          <a
            href={contact.zaloUrl}
            className="rounded-full border border-ink-700 px-8 py-3 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:border-sand-400"
          >
            {t('zalo')}
          </a>
        </div>
      </Reveal>
    </section>
  )
}
