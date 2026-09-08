import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import { Media } from '@/components/media/Media'
import { Frame } from '@/components/ui/Frame'
import { stagger } from '@/lib/motion/tokens'
import type { Testimonial } from '@/lib/content'

/**
 * Cảm nhận khách hàng — trích dẫn serif khổ lớn, tên người nói ở dạng nhãn nhỏ.
 *
 * Trích dẫn để cỡ d3 (30px) chứ không phải cỡ thân bài: một câu khách nói mà
 * in bằng đúng cỡ chữ với phần còn lại thì không ai dừng lại đọc. Đây là chỗ
 * duy nhất trên trang mà chữ serif được dùng cho một đoạn dài — và vì thế nó
 * tự nổi lên mà không cần khung riêng hay nền màu.
 */
export function Testimonials({
  items,
  locale,
}: {
  items: Testimonial[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('sections')

  // Chưa có cảm nhận thật thì không render section rỗng.
  if (items.length === 0) return null

  return (
    <Frame label={t('voices')} width="sml" bodyClassName="">
      <div className="grid divide-y divide-dashed divide-rule">
        {/* key theo index: danh sách cố định, không sắp xếp lại — tránh phụ
            thuộc vào item.name (không đảm bảo duy nhất). */}
        {items.map((item, index) => (
          <Reveal key={index} delay={index * stagger} className="p-8 sm:p-12">
            <figure>
              <blockquote className="font-display text-d3">
                “{item.quote[locale] ?? item.quote.vi}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 text-label uppercase text-ink-500">
                {item.avatar && (
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                    <Media
                      media={item.avatar}
                      locale={locale}
                      fill
                      sizes="36px"
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
    </Frame>
  )
}
