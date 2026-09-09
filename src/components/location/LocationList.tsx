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
  nhanMacDinh,
  hienSoLuong = false,
}: {
  locations: Location[]
  label?: LocalizedText
  locale: 'vi' | 'en'
  /**
   * Nhãn dùng khi người nhập bỏ trống. Bỏ qua thì rơi về "Những nơi đã ghé" —
   * đúng cho khối giữa bài, SAI cho khối chỗ ở ở cuối bài.
   */
  nhanMacDinh?: string
  /**
   * Hiện số lượng bên phải nhãn ("2 lựa chọn"). Bật ở khối chỗ ở: người đọc
   * cần biết ngay là có mấy phương án trước khi quyết định đọc tiếp hay không.
   * Tắt ở khối giữa bài — ở đó số thẻ không phải thông tin, chỉ là số thẻ.
   */
  hienSoLuong?: boolean
}) {
  const t = useTranslations('location')

  // Ngày không gắn địa điểm nào là chuyện bình thường — không dựng khung rỗng.
  if (locations.length === 0) return null

  return (
    <div className="mt-10 rounded-lg border border-dashed border-rule">
      <div className="flex items-center justify-between gap-4 border-b border-dashed border-rule px-5 py-3">
        <Eyebrow>{label ? (label[locale] ?? label.vi) : (nhanMacDinh ?? t('defaultLabel'))}</Eyebrow>
        {hienSoLuong && (
          <span className="text-label uppercase text-ink-500">
            {t('optionCount', { n: locations.length })}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {locations.map((location) => (
          <LocationCard key={location.slug} location={location} locale={locale} />
        ))}
      </div>
    </div>
  )
}
