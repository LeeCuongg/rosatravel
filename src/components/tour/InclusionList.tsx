import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { stagger } from '@/lib/motion/tokens'
import type { LocalizedText } from '@/lib/content'

export function InclusionList({
  inclusions,
  exclusions,
  notes,
  locale,
}: {
  inclusions: LocalizedText[]
  exclusions: LocalizedText[]
  /**
   * Ghi chú vận hành: ngày khởi hành, chính sách giá theo độ tuổi, phụ thu,
   * những thứ có thể đổi theo thực tế.
   *
   * Trường này CÓ trong schema và trong /admin từ lâu nhưng chưa nơi nào render
   * — người nhập gõ vào đó và nội dung biến mất không dấu vết. Phát hiện khi
   * nhập tour Canton Fair: ngày khởi hành 15/22/29.10 nằm trong `notes` và
   * không hiện ở đâu trên trang.
   *
   * Đặt ở CUỐI khối "Bao gồm / Không bao gồm" chứ không thành một khối riêng:
   * cả ba đều là thông tin tra cứu trước khi quyết định đặt, và tách ra thành
   * ba khung nét đứt liền nhau thì trang loãng ra mà không rõ hơn.
   */
  notes?: LocalizedText
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('tour')
  const text = (item: LocalizedText) => item[locale] ?? item.vi

  return (
    <Frame width="sml" bodyClassName="">
      <div className="grid divide-y divide-dashed divide-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <Reveal className="p-8 sm:p-10">
          <h3 className="text-label uppercase text-clay-500">{t('inclusions')}</h3>
          <ul className="mt-6 divide-y divide-dashed divide-rule">
            {/* key theo index: danh sách cố định, không sắp xếp lại — hai mục
                trùng chữ (vd hai lần "Bữa sáng") sẽ không duy nhất nếu dùng item.vi. */}
            {inclusions.map((item, index) => (
              <li key={index} className="py-3 text-meta">
                {text(item)}
              </li>
            ))}
          </ul>
        </Reveal>
        {exclusions.length > 0 && (
          <Reveal delay={stagger} className="p-8 sm:p-10">
            <h3 className="text-label uppercase text-ink-500">{t('exclusions')}</h3>
            <ul className="mt-6 divide-y divide-dashed divide-rule text-ink-500">
              {/* key theo index: cùng lý do ở danh sách inclusions phía trên. */}
              {exclusions.map((item, index) => (
                <li key={index} className="py-3 text-meta">
                  {text(item)}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>

      {notes && (
        <Reveal className="border-t border-dashed border-rule p-8 sm:p-10">
          <h3 className="text-label uppercase text-ink-500">{t('notes')}</h3>
          <p className="mt-6 text-meta text-ink-500">{text(notes)}</p>
        </Reveal>
      )}
    </Frame>
  )
}
