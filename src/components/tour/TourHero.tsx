import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Eyebrow, Rule } from '@/components/ui/Frame'
import { formatPrice } from '@/lib/format'
import { isVideoAsset, type ImageAsset, type Tour } from '@/lib/content'

/**
 * Đầu trang tour — dải ba ảnh tràn ngang, rồi tên chuyến đi trên nền kem.
 *
 * Bản GĐ2 là một ảnh cao 80svh với tên tour và bảng thông số đè lên góc dưới,
 * dưới một lớp phủ tối. Đổi vì hai lý do:
 *
 *  1. MỘT ảnh phải gánh cả việc "trông hấp dẫn" lẫn "làm nền đọc được cho sáu
 *     dòng chữ". Hai việc đó mâu thuẫn nhau: ảnh càng đẹp, càng nhiều chi tiết,
 *     thì chữ đè lên càng khó đọc, và cách duy nhất để cứu là phủ tối ảnh —
 *     tức là làm hỏng chính cái ảnh đó.
 *  2. Ba ảnh nói được ba điều về chuyến đi thay vì một.
 *
 * Bảng thông số giờ là các hàng ngăn bằng kẻ nét đứt trên nền kem, thay cho
 * `<dl>` xếp ngang đè lên ảnh. Đọc chậm hơn nhưng đây là thông tin người ta
 * thật sự dừng lại để đọc (giá, số ngày), không phải thứ để liếc qua.
 */

/** Ba ảnh cho dải đầu trang: ảnh bìa trước, rồi lấp bằng ảnh gallery. */
function daiAnh(tour: Tour): ImageAsset[] {
  const bia = isVideoAsset(tour.heroMedia) ? tour.heroMedia.poster : tour.heroMedia
  const daThay = new Set([bia.src])
  const themVao = tour.gallery.filter((anh) => {
    if (daThay.has(anh.src)) return false
    daThay.add(anh.src)
    return true
  })
  return [bia, ...themVao].slice(0, 3)
}

export function TourHero({ tour, locale }: { tour: Tour; locale: 'vi' | 'en' }) {
  const t = useTranslations('tour')
  const anh = daiAnh(tour)
  const diemDen = tour.destinations.map((d) => d[locale] ?? d.vi)

  const thongSo = [
    { nhan: t('duration'), gia: t('durationDays', { n: tour.durationDays }) },
    { nhan: t('priceFrom'), gia: formatPrice(tour.priceFrom, locale) },
    { nhan: t('destinations'), gia: diemDen.join(' · ') },
  ]

  return (
    <section>
      {/* Tràn hết bề ngang, không lề, không khoảng cách giữa các ảnh — dải ảnh
          phải đọc ra là MỘT khối, không phải ba tấm ảnh rời. */}
      <div className="grid grid-cols-3">
        {anh.map((image, index) => (
          <div key={image.src} className="relative aspect-[3/4] sm:aspect-[4/5]">
            <Media
              media={image}
              locale={locale}
              fill
              // Ảnh đầu là LCP của trang tour.
              priority={index === 0}
              sizes="33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="px-gutter mt-section text-center">
        <Eyebrow>{diemDen.join(' / ')}</Eyebrow>
        <h1 className="font-display text-clay-500 mx-auto mt-6 max-w-3xl text-d2 sm:text-d1">
          {tour.title[locale] ?? tour.title.vi}
        </h1>
        <p className="font-display mx-auto mt-5 max-w-xl text-d4 text-sand-200">
          {tour.tagline[locale] ?? tour.tagline.vi}
        </p>
      </div>

      <dl className="mx-auto mt-14 max-w-sml px-gutter">
        {thongSo.map((hang) => (
          <div key={hang.nhan}>
            <Rule />
            {/* Nhãn cột trái cố định 1/3, giá trị cột phải — ba hàng thẳng
                hàng nhau thành một bảng đọc được, thay vì ba cặp trôi nổi. */}
            <div className="flex gap-6 py-5">
              <dt className="w-1/3 shrink-0 text-label uppercase text-ink-500">{hang.nhan}</dt>
              <dd className="text-meta">{hang.gia}</dd>
            </div>
          </div>
        ))}
        <Rule />
      </dl>
    </section>
  )
}
