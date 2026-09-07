import { Reveal } from '@/components/motion/Reveal'
import { Media } from '@/components/media/Media'
import { stagger } from '@/lib/motion/tokens'
import type { Testimonial } from '@/lib/content'

export function Testimonials({
  items,
  locale,
}: {
  items: Testimonial[]
  locale: 'vi' | 'en'
}) {
  // Chưa có cảm nhận thật thì không render section rỗng.
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-6 py-(--spacing-section)">
      <div className="grid gap-10 sm:grid-cols-2">
        {items.map((item, index) => (
          // key theo index: danh sách cố định, không sắp xếp lại — tránh phụ
          // thuộc vào item.name (không đảm bảo duy nhất).
          <Reveal key={index} delay={index * stagger}>
            <figure>
              <blockquote className="font-[family-name:var(--font-playfair)] text-xl leading-relaxed">
                “{item.quote[locale] ?? item.quote.vi}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 text-sm text-ink-500">
                {item.avatar && (
                  <span className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Media
                      media={item.avatar}
                      locale={locale}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                )}
                {item.name}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
