import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { ContactForm } from '@/components/contact/ContactForm'
import { Frame } from '@/components/ui/Frame'
import { TextLink } from '@/components/ui/TextLink'
import { Guide } from './Guide'
import type { HomeContent } from '@/lib/content'

/**
 * THIẾT KẾ HÀNH TRÌNH — khối kết trang chủ, và là khối duy nhất có biểu mẫu.
 *
 * Thay cho FinalCta của GĐ2 (một tiêu đề + ba nút bo tròn "Liên hệ / Gọi ngay
 * / Nhắn Zalo"). Ba nút đó bắt người đọc phải tự chọn kênh liên lạc trong khi
 * thứ họ vừa nghĩ tới là chuyến đi, không phải kênh liên lạc — và cả ba đều
 * dẫn ra khỏi trang. Biểu mẫu đặt ngay tại đây rút quãng đường từ "muốn đi"
 * tới "đã gửi yêu cầu" xuống còn một màn hình.
 *
 * Dùng LẠI ContactForm của trang liên hệ, không viết bản rút gọn thứ hai. Hai
 * biểu mẫu song song là hai bộ validate, hai lần phải nhớ sửa khi đổi trường,
 * và chắc chắn sẽ lệch nhau.
 *
 * ContactForm gọi useSearchParams để chọn sẵn tour từ `?tour=`. Hook đó buộc
 * cây React phải có ranh giới Suspense thì trang mới sinh tĩnh được — thiếu
 * nó, next build dừng lại với lỗi prerender ở CHÍNH trang chủ.
 */
export function PlanTrip({
  contact,
  guide,
  tours,
  locale,
}: {
  contact: HomeContent['contact']
  guide: HomeContent['guide']
  tours: { slug: string; label: string }[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('sections')
  const tc = useTranslations('cta')

  return (
    <Frame id="thiet-ke" label={t('plan')} width="sml" bodyClassName="p-8 sm:p-14">
      <h2 className="font-display text-clay-500 text-center text-d2">{tc('finalHeadline')}</h2>
      <p className="font-display mx-auto mt-5 max-w-md text-center text-d4 text-sand-200">
        {tc.rich('finalSub', {
          email: () => <TextLink href={`mailto:${contact.email}`}>{contact.email}</TextLink>,
        })}
      </p>

      <div className="mt-12">
        <Suspense>
          <ContactForm tours={tours} />
        </Suspense>
      </div>

      {guide && <Guide guide={guide} locale={locale} className="mt-14" />}
    </Frame>
  )
}
