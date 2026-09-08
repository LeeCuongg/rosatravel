import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Rule } from '@/components/ui/Frame'
import { TextLink } from '@/components/ui/TextLink'
import { DaySection } from '@/components/story/DaySection'
import type { CaseStudy } from '@/lib/content'

/**
 * BÀI "CHUYẾN ĐÃ ĐI" — phần nội dung, dùng chung cho CẢ HAI cách mở.
 *
 * Cùng một component render ra hai nơi:
 *   - trong lớp phủ, khi người đọc bấm thẻ từ trang chủ
 *   - trong trang đầy đủ /chuyen-di/<slug>, khi mở thẳng link hoặc tải lại
 *
 * Đó là lý do ở đây KHÔNG có nút đóng, không có thanh trên, không có khoá
 * cuộn: những thứ đó thuộc về cái khung bọc ngoài, và hai khung khác nhau.
 * Trộn chúng vào đây là ép trang đầy đủ phải mọc ra một nút "đóng" không biết
 * đóng đi đâu.
 *
 * `data-accent` đặt ở gốc bài: mọi `text-accent` bên trong (kể cả trong
 * DaySection lồng sâu) tự lấy màu riêng của bài này qua CSS, không phải truyền
 * màu xuống từng cấp bằng prop.
 */
export function CaseArticle({
  caseStudy,
  locale,
}: {
  caseStudy: CaseStudy
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('caseStudy')
  const tc = useTranslations('cta')

  return (
    <article data-accent={caseStudy.accent}>
      {/* ── Ảnh đầu bài, chữ đè lên ─────────────────────────────────────────
          Đây là chỗ DUY NHẤT trên toàn site còn đặt chữ lên ảnh. Được phép vì
          nó có lớp phủ tối đặc ở đáy và chữ là màu kem — quan hệ ngược hẳn với
          phần còn lại của site (chữ tối trên nền kem), nên nó đọc ra như bìa
          một bài phóng sự, tách khỏi mọi thứ khác. */}
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[21/9]">
        <Media
          media={caseStudy.heroImage}
          locale={locale}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Mốc chuyển màu khai RÕ RÀNG, không để mặc định.
            Mặc định (0% → 50% → 100%) đặt điểm giữa của chuyển sắc vào chính
            giữa ảnh, trong khi chữ nằm ở khoảng 65–75% tính từ đáy — tức là
            rơi vào vùng lớp phủ đã gần trong suốt. Trên ảnh có nền trời sáng,
            chữ kem gần như biến mất.
            Đo lại ở mức 65%: chữ #fdf8ec trên nền trời sáng nhất (#cfe0f0) pha
            65% màu #403232 cho 4.54:1 — vượt ngưỡng WCAG AA cho cả chữ thường,
            không chỉ chữ lớn. Hạ con số đó xuống là trượt chuẩn. */}
        <div className="absolute inset-0 bg-gradient-to-t from-sand-100/90 from-25% via-sand-100/65 via-75% to-sand-100/15" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-12">
          <h1 className="font-display text-ink-950 text-d2 sm:text-d1">
            {caseStudy.title[locale] ?? caseStudy.title.vi}
          </h1>
          <p className="font-display mt-2 text-d4 text-ink-950/85 italic">
            {caseStudy.subtitle[locale] ?? caseStudy.subtitle.vi}
          </p>
        </div>
      </div>

      {/* ── Điểm nhấn + Rosa đã lo những gì ────────────────────────────────── */}
      <div className="mx-auto max-w-sml px-gutter pt-section">
        <Reveal>
          <div className="grid gap-12 sm:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-label uppercase text-accent">{t('highlights')}</p>
              <div className="mt-6 space-y-4">
                {/* key theo index: mảng cố định, hai đoạn trùng chữ vẫn là hai đoạn. */}
                {caseStudy.highlights.map((doan, index) => (
                  <p key={index} className="text-body text-sand-200">
                    {doan[locale] ?? doan.vi}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-label uppercase text-accent">{t('ourRole')}</p>
              <ul className="mt-6 divide-y divide-dashed divide-rule">
                {caseStudy.ourRole.map((viec, index) => (
                  <li key={index} className="py-3 text-meta text-ink-500">
                    {viec[locale] ?? viec.vi}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 text-center">
            <TextLink href="/lien-he" size="lg">
              {tc('planTrip')}
            </TextLink>
          </div>
        </Reveal>
      </div>

      {/* ── Kể theo ngày ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-sml px-gutter pt-section pb-section">
        <ol>
          {caseStudy.days.map((ngay) => (
            <DaySection
              key={ngay.day}
              day={ngay.day}
              title={ngay.title}
              paragraphs={ngay.body}
              images={ngay.images}
              locations={ngay.locations}
              locationsLabel={ngay.locationsLabel}
              locale={locale}
            />
          ))}
        </ol>
        <Rule />
      </div>
    </article>
  )
}
