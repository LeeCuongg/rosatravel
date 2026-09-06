import { Reveal } from '@/components/motion/Reveal'
import { stagger } from '@/lib/motion/tokens'
import { TourCard } from './TourCard'
import type { Tour } from '@/lib/content'

export function TourGrid({ tours, locale }: { tours: Tour[]; locale: 'vi' | 'en' }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-(--spacing-section)">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour, index) => (
          <Reveal key={tour.slug} delay={index * stagger}>
            <TourCard tour={tour} locale={locale} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
