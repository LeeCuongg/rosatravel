import { Reveal } from '@/components/motion/Reveal'
import { stagger } from '@/lib/motion/tokens'
import type { HomeContent } from '@/lib/content'

interface WhyUsProps {
  items: HomeContent['whyUs']
  locale: 'vi' | 'en'
}

export function WhyUs({ items, locale }: WhyUsProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-(--spacing-section)">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.title.vi} delay={index * stagger}>
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl">
              {item.title[locale] ?? item.title.vi}
            </h3>
            <p className="mt-3 text-ink-500">{item.body[locale] ?? item.body.vi}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
