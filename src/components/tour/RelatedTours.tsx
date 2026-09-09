import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { TourCard } from '@/components/home/TourCard'
import { stagger } from '@/lib/motion/tokens'
import type { Tour } from '@/lib/content'

/**
 * "Hành trình khác" — cuối mỗi trang tour.
 *
 * Không có khối này thì trang tour là ngõ cụt: đọc xong, nếu chuyến đi đó không
 * hợp, người ta đóng tab. Đây là chỗ giữ họ lại trong site. Spots đặt đúng một
 * khối như vậy ("More Spots to Discover") ở cuối mọi trang chi tiết.
 *
 * Dùng LẠI TourCard của trang chủ, không làm thẻ riêng: cùng một tour phải
 * trông giống hệt nhau ở mọi nơi nó xuất hiện, nếu không người đọc phải học
 * lại cách đọc thẻ ở mỗi trang.
 */

/** Bốn thẻ là vừa một hàng và không kéo trang dài thêm quá một màn hình. */
const SO_LUONG = 4

export function RelatedTours({
  tours,
  currentSlug,
  locale,
}: {
  tours: Tour[]
  currentSlug: string
  locale: 'vi' | 'en'
}) {
  // Hook phải gọi TRƯỚC mọi lệnh return sớm, không được gọi trong JSX bên dưới
  // nhánh `if` — React yêu cầu số lần gọi hook giống nhau ở mọi lần render.
  const t = useTranslations('sections')

  // Loại chính tour đang xem. Không lọc thì thẻ đầu tiên là một liên kết dẫn
  // về đúng trang người ta đang đứng.
  const khac = tours.filter((tour) => tour.slug !== currentSlug).slice(0, SO_LUONG)

  // Site mới chỉ có một tour thì khối này rỗng — ẩn hẳn thay vì để một khung
  // nét đứt trống trơn ở cuối trang.
  if (khac.length === 0) return null

  return (
    <Frame label={t('related')} bodyClassName="">
      <div className="grid divide-y divide-dashed divide-rule sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
        {khac.map((tour, index) => (
          <Reveal key={tour.slug} delay={index * stagger} className="p-6 sm:p-8">
            <TourCard tour={tour} locale={locale} index={index} />
          </Reveal>
        ))}
      </div>
    </Frame>
  )
}
