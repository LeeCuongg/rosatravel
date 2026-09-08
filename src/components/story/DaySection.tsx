import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Rule } from '@/components/ui/Frame'
import { LocationList } from '@/components/location/LocationList'
import type { ImageAsset, LocalizedText, Location } from '@/lib/content'

/**
 * MỘT NGÀY trong bài kể — dùng CHUNG cho lịch trình tour và cho bài "Chuyến đã đi".
 *
 * Hai chỗ đó khác nhau về mục đích (một cái bán hàng, một cái làm bằng chứng)
 * nhưng giống hệt nhau về hình thức: số ngày, tiêu đề khổ lớn, dải ảnh, mấy
 * đoạn văn, rồi khối địa điểm. Tách ra một component là cách duy nhất để hai
 * chỗ không trôi dạt khỏi nhau sau vài lần sửa.
 *
 * Tiêu đề dùng `text-accent`, không phải `text-clay-500`. Ở trang tour thì hai
 * màu đó bằng nhau; bên trong một bài "Chuyến đã đi" thì `--accent` được khối
 * cha đặt lại thành màu riêng của bài đó. Cùng một component, hai ngữ cảnh, mà
 * không cần truyền màu xuống qua prop.
 */

/**
 * Bố cục dải ảnh theo SỐ LƯỢNG ảnh, không phải theo một lưới cố định.
 *
 * Một ảnh đứng một mình phải nằm ngang và rộng hết cột — đó là ảnh "toàn cảnh".
 * Hai ảnh cạnh nhau thì phải dọc, nếu không mỗi tấm bị bóp còn một dải mỏng.
 * Ba ảnh thì dọc và hẹp hơn nữa. Dùng chung một tỉ lệ cho cả ba trường hợp là
 * cách chắc chắn để có ít nhất một trường hợp trông sai.
 *
 * Chuỗi class phải viết đầy đủ (không ghép chuỗi) thì Tailwind mới quét thấy.
 */
const BO_CUC_ANH = {
  1: { grid: 'grid-cols-1', aspect: 'aspect-[16/9]', sizes: '(max-width: 900px) 100vw, 820px' },
  2: { grid: 'grid-cols-2', aspect: 'aspect-[4/5]', sizes: '(max-width: 900px) 50vw, 400px' },
  3: { grid: 'grid-cols-3', aspect: 'aspect-[3/4]', sizes: '(max-width: 900px) 33vw, 265px' },
} as const

/** Quá ba ảnh thì mỗi tấm bé đến mức không nhận ra gì — cắt bớt. */
const TOI_DA_ANH = 3

interface DaySectionProps {
  day: number
  title: LocalizedText
  /** Mảng đoạn văn. Lịch trình tour hiện chỉ có một đoạn; bài kể thì nhiều. */
  paragraphs: LocalizedText[]
  images: ImageAsset[]
  locations: Location[]
  locationsLabel?: LocalizedText
  locale: 'vi' | 'en'
  /**
   * Gắn `data-parallax` lên từng ô ảnh. CHỈ bật ở trang tour, nơi
   * ItineraryCinematic có sẵn ScrollTrigger đọc thuộc tính này. Bật trong lớp
   * phủ "Chuyến đã đi" là vô nghĩa: nội dung ở đó cuộn trong một khung riêng,
   * không phải cuộn theo trang, nên ScrollTrigger đo sai hoàn toàn.
   */
  parallax?: boolean
}

export function DaySection({
  day,
  title,
  paragraphs,
  images,
  locations,
  locationsLabel,
  locale,
  parallax = false,
}: DaySectionProps) {
  const t = useTranslations('tour')
  const anh = images.slice(0, TOI_DA_ANH)
  const boCuc = BO_CUC_ANH[(anh.length || 1) as 1 | 2 | 3]

  return (
    <li className="pt-10 pb-14">
      <Rule className="-mt-10 mb-10" />
      <Reveal>
        <p className="text-label uppercase text-accent">{t('day', { n: day })}</p>
        <h3 className="font-display mt-3 text-d3 sm:text-d2">{title[locale] ?? title.vi}</h3>
      </Reveal>

      {anh.length > 0 && (
        <div className={`mt-8 grid gap-3 ${boCuc.grid}`}>
          {anh.map((image, index) => (
            <div key={`${image.src}-${index}`} className={`relative ${boCuc.aspect} overflow-hidden`}>
              {/* yPercent dịch theo % chiều cao của CHÍNH phần tử này, không phải
                  của cha. Biên độ thật = 0.08 × 120% = 9.6% chiều cao cha, nên
                  phần dư mỗi bên (10%) phải lớn hơn con số đó. Đổi biên độ
                  yPercent trong ItineraryCinematic thì phải tính lại h ở đây:
                  (h - 100) / 2 >= 0.08h */}
              <div
                {...(parallax ? { 'data-parallax': '' } : {})}
                className={parallax ? 'absolute inset-x-0 -top-[10%] h-[120%]' : 'absolute inset-0'}
              >
                <Media
                  media={image}
                  locale={locale}
                  fill
                  sizes={boCuc.sizes}
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Reveal>
        <div className="mt-8 space-y-4">
          {/* key theo index: mảng đoạn văn cố định, không sắp xếp lại, và hai
              đoạn trùng chữ vẫn phải là hai đoạn riêng. */}
          {paragraphs.map((doan, index) => (
            <p key={index} className="text-body text-sand-200">
              {doan[locale] ?? doan.vi}
            </p>
          ))}
        </div>
        <LocationList locations={locations} label={locationsLabel} locale={locale} />
      </Reveal>
    </li>
  )
}
