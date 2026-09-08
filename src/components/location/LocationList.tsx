import { useTranslations } from 'next-intl'
import { Eyebrow } from '@/components/ui/Frame'
import { LocationCard } from './LocationCard'
import type { LocalizedText, Location } from '@/lib/content'

/**
 * KHỐI ĐỊA ĐIỂM nhúng giữa bài — nhãn ở trên, các thẻ xếp dọc bên dưới, tất cả
 * nằm trong một khung nét đứt.
 *
 * Khung ở đây làm một việc cụ thể chứ không phải trang trí: nó nói với người
 * đang đọc rằng phần này KHÔNG phải đoạn tiếp theo của bài, mà là một danh
 * sách xen vào. Bỏ khung đi thì tên quán đọc như một đoạn văn bị đứt quãng.
 *
 * Nhãn do người nhập đặt ("Ăn ở đâu", "Ngủ ở đâu") vì cùng một khối thẻ mang
 * ý nghĩa khác nhau ở mỗi ngày. Bỏ trống thì rơi về nhãn chung.
 */
export function LocationList({
  locations,
  label,
  locale,
}: {
  locations: Location[]
  label?: LocalizedText
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('location')

  // Ngày không gắn địa điểm nào là chuyện bình thường — không dựng khung rỗng.
  if (locations.length === 0) return null

  return (
    <div className="mt-10 border border-dashed border-rule">
      <div className="border-b border-dashed border-rule px-5 py-3">
        <Eyebrow>{label ? (label[locale] ?? label.vi) : t('defaultLabel')}</Eyebrow>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {locations.map((location) => (
          <LocationCard key={location.slug} location={location} locale={locale} />
        ))}
      </div>
    </div>
  )
}
