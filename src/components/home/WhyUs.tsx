import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { stagger } from '@/lib/motion/tokens'
import type { HomeContent } from '@/lib/content'

interface WhyUsProps {
  items: HomeContent['whyUs']
  locale: 'vi' | 'en'
}

/**
 * "Vì sao chọn chúng tôi" — ba cột trong khung nét đứt, ngăn nhau bằng vách
 * cùng kiểu.
 *
 * Bản GĐ2 là ba cột chữ trần giữa khoảng trắng, không nhãn, không đường kẻ.
 * Nội dung y hệt bản này. Khác biệt duy nhất là cái khung — và đó là toàn bộ
 * lý do bản cũ đọc như bản nháp còn bản này đọc như một trang đã được thiết
 * kế. Đường kẻ nói với mắt rằng ba cột này là một nhóm có chủ đích, chứ không
 * phải ba đoạn văn tình cờ nằm cạnh nhau.
 *
 * Các tiện ích divide đổi hướng theo breakpoint: một cột dọc trên điện thoại
 * thì vách ngăn phải NẰM NGANG. Để nguyên divide-x là trên điện thoại các mục
 * dính liền nhau, không còn ranh giới nào.
 */
export function WhyUs({ items, locale }: WhyUsProps) {
  const t = useTranslations('sections')

  return (
    <Frame label={t('whyUs')} bodyClassName="">
      <div className="grid divide-y divide-dashed divide-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {/* key theo index: đây là danh sách cố định, không sắp xếp lại — dùng
            item.title.vi làm key khiến React reconciliation phụ thuộc vào
            nội dung hiển thị, sai khi hai mục trùng chữ. */}
        {items.map((item, index) => (
          <Reveal key={index} delay={index * stagger} className="p-8 sm:p-10">
            <h3 className="font-display text-clay-500 text-d4">
              {item.title[locale] ?? item.title.vi}
            </h3>
            <p className="mt-4 text-meta text-ink-500">{item.body[locale] ?? item.body.vi}</p>
          </Reveal>
        ))}
      </div>
    </Frame>
  )
}
