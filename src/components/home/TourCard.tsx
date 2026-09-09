import type { CSSProperties } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { formatPrice } from '@/lib/format'
import { isVideoAsset } from '@/lib/content/guards'
import type { Tour } from '@/lib/content'

/**
 * Thẻ tour — ảnh ở trên, chữ ở DƯỚI ảnh trên nền kem.
 *
 * Bản GĐ2 đặt tên tour và giá đè lên ảnh, dưới một lớp phủ chuyển sắc. Cách đó
 * kéo theo một ràng buộc khó chịu mà globals.css từng phải ghi lại thành cảnh
 * báo: độ đục lớp phủ không được tụt dưới 80%, nếu không chữ trên ảnh tối sẽ
 * trượt chuẩn tương phản WCAG. Đưa chữ ra khỏi ảnh là ràng buộc đó biến mất —
 * chữ nằm trên nền kem đặc, tỉ lệ tương phản cố định bất kể ảnh bìa là ảnh nào.
 *
 * Nó cũng đọc ra khác hẳn: chữ đè lên ảnh là ngôn ngữ của banner quảng cáo,
 * chữ đặt dưới ảnh là ngôn ngữ của chú thích trong tạp chí.
 */
/**
 * Góc nghiêng khi hover, xoay vòng theo vị trí thẻ trong lưới.
 *
 * Ba giá trị lệch nhau chứ không phải một góc dùng chung: bốn thẻ cùng nghiêng
 * đúng 2deg trông như lỗi căn chỉnh, còn góc khác nhau trông như ai đó vừa đặt
 * từng tấm ảnh xuống bàn. Số âm xen vào giữa để hai thẻ cạnh nhau không bao giờ
 * nghiêng cùng chiều.
 */
const GOC_NGHIENG = ['2deg', '-3deg', '3deg'] as const

export function TourCard({
  tour,
  locale,
  index = 0,
}: {
  tour: Tour
  locale: 'vi' | 'en'
  /** Vị trí trong lưới — chỉ dùng để chọn góc nghiêng. */
  index?: number
}) {
  const t = useTranslations('tour')
  const cover = isVideoAsset(tour.heroMedia) ? tour.heroMedia.poster : tour.heroMedia

  return (
    <Link
      href={`/tour/${tour.slug}`}
      style={{ '--goc-nghieng': GOC_NGHIENG[index % GOC_NGHIENG.length] } as CSSProperties}
      className="group the-nghieng block"
    >
      {/* Ảnh trong THẺ bo 8px, ảnh tràn màn hình (đầu bài, dải hero) để vuông.
          Spots tách bạch đúng như vậy: `.c-card` bo 8px và cắt gọn ảnh bên
          trong, còn ảnh full-bleed thì bo 0. Lý do là chức năng chứ không phải
          thẩm mỹ — ảnh trong thẻ là một VẬT THỂ nằm trên nền, nên nó cần đường
          viền của riêng nó; ảnh tràn màn hình chính LÀ nền, bo góc nó thì thành
          một tấm dán lơ lửng. */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-card-off transition-shadow duration-[var(--duration-base)] ease-[var(--ease-hover)] group-hover:shadow-card">
        <Media
          media={cover}
          locale={locale}
          fill
          // Lưới tối đa max-w-med (1200px), 3 cột + vách ngăn + đệm 40px mỗi ô
          // => ảnh dừng ở ~320px. Để 33vw thì trên màn hình 2560px trình duyệt
          // sẽ đòi ~845px và tải biến thể to vô ích.
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          className="object-cover transition-transform duration-[var(--duration-base)] ease-[var(--ease-hover)] group-hover:scale-105"
        />
      </div>
      <h3 className="font-display mt-5 text-d4 transition-colors duration-[var(--duration-base)] ease-[var(--ease-hover)] group-hover:text-clay-500">
        {tour.title[locale] ?? tour.title.vi}
      </h3>
      <p className="mt-2 text-meta text-ink-500">
        {t('durationDays', { n: tour.durationDays })} · {t('priceFrom')}{' '}
        {formatPrice(tour.priceFrom, locale)}
      </p>
    </Link>
  )
}
