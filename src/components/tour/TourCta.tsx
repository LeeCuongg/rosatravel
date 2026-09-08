import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { TextLink } from '@/components/ui/TextLink'

/**
 * CTA cuối trang tour.
 *
 * Cố tình KHÔNG đặt biểu mẫu đầy đủ ở đây như trang chủ. Người đọc tới được
 * cuối một trang tour là đã chọn xong chuyến đi — thứ họ cần là một cú bấm,
 * không phải bốn ô để điền. Biểu mẫu ở trang liên hệ sẽ tự chọn sẵn đúng tour
 * này nhờ tham số `?tour=`.
 */
export function TourCta({ slug }: { slug: string }) {
  const t = useTranslations('cta')

  return (
    <Frame width="sml" bodyClassName="p-10 sm:p-16 text-center">
      <Reveal>
        <h2 className="font-display text-clay-500 text-d2">{t('tourHeadline')}</h2>
        <p className="mt-4 text-meta text-ink-500">{t('tourSub')}</p>
        {/* ?tour=<slug> được ContactForm đọc để chọn sẵn tour trong dropdown. */}
        <div className="mt-10">
          <TextLink href={`/lien-he?tour=${slug}`} size="lg">
            {t('bookNow')}
          </TextLink>
        </div>
      </Reveal>
    </Frame>
  )
}
