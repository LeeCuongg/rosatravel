import { useTranslations } from 'next-intl'
import { Frame } from '@/components/ui/Frame'
import type { HomeContent } from '@/lib/content'

/**
 * CÂU HỎI THƯỜNG GẶP — accordion đánh số, mở/đóng bằng HTML thuần.
 *
 * Dùng <details>/<summary> chứ không phải state React. Ba thứ có được miễn
 * phí và không phải viết dòng nào: bàn phím (Enter/Space đóng mở), ngữ nghĩa
 * cho trình đọc màn hình (aria-expanded do trình duyệt tự quản), và nội dung
 * nằm sẵn trong HTML nên Google đọc được câu trả lời kể cả khi mục đang đóng.
 * Một accordion viết tay bằng useState phải làm lại cả ba, và thường làm thiếu.
 *
 * Số thứ tự "01, 02..." không phải trang trí: nó cho người đọc biết danh sách
 * này hữu hạn và họ đang ở đâu trong đó. Đánh số từ chỉ mục mảng chứ không lưu
 * trong CMS — người nhập kéo thả sắp lại thứ tự thì số phải đi theo.
 */
export function Faq({ items, locale }: { items: HomeContent['faq']; locale: 'vi' | 'en' }) {
  const t = useTranslations('sections')

  // Chưa nhập câu hỏi nào thì không dựng khung rỗng.
  if (items.length === 0) return null

  return (
    <Frame label={t('faq')} width="sml" bodyClassName="">
      <div className="divide-y divide-dashed divide-rule">
        {/* key theo index: danh sách cố định, không sắp xếp lại — hai câu hỏi
            trùng chữ vẫn phải là hai mục riêng. */}
        {items.map((item, index) => (
          <details key={index} className="group px-6 py-5 sm:px-10">
            <summary className="flex cursor-pointer list-none items-center gap-5">
              <span className="text-label text-clay-500 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 text-meta transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] group-hover:text-clay-500">
                {item.question[locale] ?? item.question.vi}
              </span>
              {/* Dấu cộng thành dấu trừ khi mở. Vẽ bằng hai gạch xoay chứ không
                  dùng ký tự +/− : ký tự đổi theo font, hai gạch thì không. */}
              <span
                aria-hidden
                className="relative h-6 w-6 shrink-0 rounded-full border border-dashed border-rule"
              >
                <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 bg-sand-400" />
                <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-sand-400 transition-transform duration-[var(--duration-base)] ease-[var(--ease-hover)] group-open:rotate-0" />
              </span>
            </summary>
            {/* pl khớp với bề rộng cột số + gap ở trên, để câu trả lời thẳng
                hàng với câu hỏi chứ không thụt về mép trái. */}
            <p className="mt-4 pl-[calc(1.75rem+1.25rem)] text-meta text-ink-500">
              {item.answer[locale] ?? item.answer.vi}
            </p>
          </details>
        ))}
      </div>
    </Frame>
  )
}
