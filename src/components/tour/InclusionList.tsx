import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import { stagger } from '@/lib/motion/tokens'
import type { LocalizedText } from '@/lib/content'

export function InclusionList({
  inclusions,
  exclusions,
  locale,
}: {
  inclusions: LocalizedText[]
  exclusions: LocalizedText[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('tour')
  const text = (item: LocalizedText) => item[locale] ?? item.vi

  return (
    <section className="mx-auto max-w-5xl px-6 py-(--spacing-section)">
      <div className="grid gap-12 sm:grid-cols-2">
        <Reveal>
          <h3 className="text-sm uppercase tracking-widest text-clay-500">{t('inclusions')}</h3>
          <ul className="mt-4 space-y-2">
            {inclusions.map((item) => (
              <li key={item.vi} className="border-b border-ink-700 pb-2">
                {text(item)}
              </li>
            ))}
          </ul>
        </Reveal>
        {exclusions.length > 0 && (
          <Reveal delay={stagger}>
            <h3 className="text-sm uppercase tracking-widest text-ink-500">{t('exclusions')}</h3>
            <ul className="mt-4 space-y-2 text-ink-500">
              {exclusions.map((item) => (
                <li key={item.vi} className="border-b border-ink-700 pb-2">
                  {text(item)}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  )
}
