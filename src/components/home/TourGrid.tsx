import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { stagger } from '@/lib/motion/tokens'
import { TourCard } from './TourCard'
import type { Tour } from '@/lib/content'

/**
 * Lưới tour nổi bật.
 *
 * `id` dùng cho liên kết "Hành trình" trên header nhảy tới. Đổi tên id thì đổi
 * cả href trong Header.tsx — không có gì nối hai chỗ đó lại với nhau.
 *
 * Ba cột, ngăn bằng vách nét đứt dọc giống hệt WhyUs. Sự lặp lại đó là có chủ
 * đích: hai khối cạnh nhau dùng chung một cách chia ô thì cả trang đọc ra một
 * hệ thống, chứ không phải một chuỗi section mỗi cái một kiểu.
 */
export function TourGrid({ tours, locale }: { tours: Tour[]; locale: 'vi' | 'en' }) {
  const t = useTranslations('sections')

  if (tours.length === 0) return null

  return (
    <Frame id="hanh-trinh" label={t('journeys')} bodyClassName="">
      <div className="grid divide-y divide-dashed divide-rule sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
        {tours.map((tour, index) => (
          <Reveal
            key={tour.slug}
            delay={index * stagger}
            // Đệm đặt ở TỪNG ô chứ không ở lưới: với lưới nhiều hàng, đệm chung
            // ở cấp lưới sẽ để ảnh hàng dưới dính sát vách ngăn ngang. Mỗi ô tự
            // lo khoảng cách của mình thì bố cục đúng ở mọi số lượng tour.
            className="p-8 sm:p-10"
          >
            <TourCard tour={tour} locale={locale} />
          </Reveal>
        ))}
      </div>
    </Frame>
  )
}
