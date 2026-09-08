import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { stagger } from '@/lib/motion/tokens'
import type { CaseStudy } from '@/lib/content'

/**
 * KHỐI "CHUYẾN ĐÃ ĐI" trên trang chủ — ảnh cắt tròn, tên bên dưới.
 *
 * Ảnh TRÒN là lựa chọn có chủ đích, không phải trang trí. Mọi ảnh khác trên
 * site đều là hình chữ nhật; bốn hình tròn ở giữa trang tự tách mình ra và
 * báo cho người đọc rằng đây là loại nội dung khác — không phải sản phẩm đang
 * bán như lưới tour phía trên. Hình tròn cũng xoá bỏ khác biệt tỉ lệ giữa các
 * ảnh, nên bốn thẻ luôn cân nhau bất kể người nhập chọn ảnh gì.
 *
 * Thẻ là <Link> tới /chuyen-di/<slug>, KHÔNG phải <button> mở lớp phủ bằng
 * state. Nhờ vậy nó vẫn là một liên kết thật: mở tab mới được, copy link
 * được, Google theo được. Việc biến nó thành lớp phủ do intercepting route
 * của Next lo — xem src/app/[locale]/@modal.
 */
export function CaseGrid({
  cases,
  locale,
}: {
  cases: CaseStudy[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('sections')

  // Chưa viết bài nào thì không dựng khung rỗng.
  if (cases.length === 0) return null

  return (
    <Frame id="chuyen-da-di" label={t('caseStudies')} bodyClassName="">
      <div className="grid divide-y divide-dashed divide-rule sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
        {cases.map((item, index) => (
          <Reveal key={item.slug} delay={index * stagger} className="p-8 sm:p-6">
            <Link
              href={`/chuyen-di/${item.slug}`}
              data-accent={item.accent}
              className="group flex flex-col items-center text-center"
            >
              <div className="relative aspect-square w-full max-w-[13rem] overflow-hidden rounded-full">
                <Media
                  media={item.thumbnail}
                  locale={locale}
                  fill
                  // Bốn cột trong khung 1200px trừ đệm => ô dừng ở ~208px.
                  sizes="(max-width: 640px) 60vw, 208px"
                  className="object-cover transition-transform duration-[var(--duration-slower)] ease-[var(--ease-hover)] group-hover:scale-105"
                />
              </div>
              <h3 className="font-display mt-6 text-d4 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] group-hover:text-accent">
                {item.title[locale] ?? item.title.vi}
              </h3>
              <p className="mt-2 text-meta text-ink-500">
                {item.subtitle[locale] ?? item.subtitle.vi}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </Frame>
  )
}
