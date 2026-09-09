import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Rule } from '@/components/ui/Frame'
import { LocationList } from '@/components/location/LocationList'
import type { ImageAsset, ItineraryDay, LocalizedText, Location } from '@/lib/content'

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

/**
 * Với mỗi ảnh, trả về CHỈ SỐ ĐOẠN VĂN mà nó đứng ngay sau.
 *
 * Chia đều, không dồn về đầu: `(i+1) * soDoan / (soAnh+1)` đặt các ảnh vào
 * những mốc cách nhau bằng nhau trong chuỗi đoạn văn. Ba đoạn + hai ảnh cho ra
 * đoạn → ảnh → đoạn → ảnh → đoạn, đúng nhịp cần.
 *
 * Không nhận vị trí từ người nhập, và đó là giới hạn có ý thức — xem giải thích
 * ở `imageLayout` trong src/lib/content/schema.ts.
 */
function viTriXen(soDoan: number, soAnh: number): number[] {
  return Array.from({ length: soAnh }, (_, i) => Math.ceil(((i + 1) * soDoan) / (soAnh + 1)) - 1)
}

/**
 * MỘT Ô ẢNH, kèm chú thích và nguồn nếu có.
 *
 * `<figure>` chứ không phải `<div>`: chú thích phải được nối với đúng bức ảnh
 * nó mô tả, và `<figcaption>` là cách duy nhất trình đọc màn hình hiểu được
 * quan hệ đó. Một `<p>` đặt cạnh ảnh thì với chúng chỉ là một đoạn văn lạc.
 */
function OAnh({
  image,
  locale,
  aspect,
  sizes,
  parallax,
}: {
  image: ImageAsset
  locale: 'vi' | 'en'
  aspect: string
  sizes: string
  parallax: boolean
}) {
  const chuThich = image.caption?.[locale] ?? image.caption?.vi

  return (
    <figure>
      <div className={`relative ${aspect} overflow-hidden`}>
        {/* yPercent dịch theo % chiều cao của CHÍNH phần tử này, không phải
            của cha. Biên độ thật = 0.08 × 120% = 9.6% chiều cao cha, nên phần
            dư mỗi bên (10%) phải lớn hơn con số đó. Đổi biên độ yPercent trong
            ItineraryCinematic thì phải tính lại h ở đây: (h - 100) / 2 >= 0.08h */}
        <div
          {...(parallax ? { 'data-parallax': '' } : {})}
          className={parallax ? 'absolute inset-x-0 -top-[10%] h-[120%]' : 'absolute inset-0'}
        >
          <Media media={image} locale={locale} fill sizes={sizes} className="object-cover" />
        </div>
      </div>

      {/* Nguồn ảnh in ra kể cả khi không có chú thích: đó là ràng buộc bản
          quyền, không phải một chi tiết biên tập tuỳ chọn. */}
      {(chuThich || image.credit) && (
        <figcaption className="mt-2 text-meta text-ink-500">
          {chuThich}
          {chuThich && image.credit && ' '}
          {image.credit && <span className="text-ink-700">{image.credit}</span>}
        </figcaption>
      )}
    </figure>
  )
}

interface DaySectionProps {
  day: number
  title: LocalizedText
  /** Mảng đoạn văn. Lịch trình tour hiện chỉ có một đoạn; bài kể thì nhiều. */
  paragraphs: LocalizedText[]
  images: ImageAsset[]
  /**
   * Các mốc giờ trong ngày. Chỉ lịch trình TOUR có; bài "Chuyến đã đi" thì
   * không — bài kể lại một chuyến đã xong, và ở đó mốc giờ là thông tin vô
   * dụng: chuyến đó đã diễn ra rồi, không ai cần biết mấy giờ phải có mặt.
   */
  schedule?: ItineraryDay['schedule']
  locations: Location[]
  locationsLabel?: LocalizedText
  locale: 'vi' | 'en'
  /**
   * `dai` (mặc định): ảnh gom thành một dải trên đầu ngày.
   * `xen`: ảnh chia đều vào giữa các đoạn văn.
   *
   * Lịch trình tour luôn dùng `dai` — ở đó mỗi ngày chỉ có một đoạn mô tả, nên
   * không có gì để xen vào giữa.
   */
  imageLayout?: 'dai' | 'xen'
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
  schedule,
  locations,
  locationsLabel,
  locale,
  imageLayout = 'dai',
  parallax = false,
}: DaySectionProps) {
  const t = useTranslations('tour')
  const anh = images.slice(0, TOI_DA_ANH)
  const boCuc = BO_CUC_ANH[(anh.length || 1) as 1 | 2 | 3]

  // Ảnh xen luôn nằm một mình hết chiều ngang cột chữ: nó đang đóng vai một
  // nhịp nghỉ giữa hai đoạn, và hai tấm nhỏ cạnh nhau thì đọc ra thành một
  // khối album chen vào giữa bài, đúng thứ chế độ này sinh ra để tránh.
  const xen = imageLayout === 'xen' && anh.length > 0 && paragraphs.length > 0
  const moc = xen ? viTriXen(paragraphs.length, anh.length) : []

  return (
    <li className="pt-10 pb-14">
      <Rule className="-mt-10 mb-10" />
      <Reveal>
        <p className="text-label uppercase text-accent">{t('day', { n: day })}</p>
        <h3 className="font-display mt-3 text-d3 sm:text-d2">{title[locale] ?? title.vi}</h3>
      </Reveal>

      {!xen && anh.length > 0 && (
        <div className={`mt-8 grid gap-3 ${boCuc.grid}`}>
          {anh.map((image, index) => (
            <OAnh
              key={`${image.src}-${index}`}
              image={image}
              locale={locale}
              aspect={boCuc.aspect}
              sizes={boCuc.sizes}
              parallax={parallax}
            />
          ))}
        </div>
      )}

      <Reveal>
        <div className="mt-8 space-y-4">
          {/* key theo index: mảng đoạn văn cố định, không sắp xếp lại, và hai
              đoạn trùng chữ vẫn phải là hai đoạn riêng. */}
          {paragraphs.map((doan, index) => (
            <div key={index} className="space-y-4">
              <p className="text-body text-sand-200">{doan[locale] ?? doan.vi}</p>
              {xen &&
                anh
                  .filter((_, i) => moc[i] === index)
                  .map((image, i) => (
                    <OAnh
                      key={`${image.src}-xen-${i}`}
                      image={image}
                      locale={locale}
                      aspect={BO_CUC_ANH[1].aspect}
                      sizes={BO_CUC_ANH[1].sizes}
                      parallax={parallax}
                    />
                  ))}
            </div>
          ))}
        </div>
        {/* CÁC MỐC TRONG NGÀY — bảng hai cột, giờ bên trái.
            Dùng <dl> chứ không phải <ul>: đây là quan hệ mốc-giờ ↔ việc, đúng
            nghĩa danh sách định nghĩa, và trình đọc màn hình đọc ra được cặp
            đó thay vì hai mẩu chữ rời.
            Cột giờ rộng cố định 5rem và canh trên: nhiều mốc chỉ có một từ
            ("Chiều") trong khi nội dung dài ba dòng, canh giữa thì con số trôi
            xuống giữa đoạn và mất tác dụng làm mốc để mắt bám vào. */}
        {schedule && schedule.length > 0 && (
          <dl className="mt-8 divide-y divide-dashed divide-rule border-t border-dashed border-rule">
            {schedule.map((moc, index) => (
              <div key={index} className="grid gap-1 py-4 sm:grid-cols-[5rem_1fr] sm:gap-6">
                <dt className="text-label uppercase text-accent">{moc.time}</dt>
                <dd className="text-body text-sand-200">{moc.text[locale] ?? moc.text.vi}</dd>
              </div>
            ))}
          </dl>
        )}

        <LocationList locations={locations} label={locationsLabel} locale={locale} />
      </Reveal>
    </li>
  )
}
