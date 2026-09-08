import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { stagger } from '@/lib/motion/tokens'
import type { LocalizedText } from '@/lib/content'

export function InclusionList({
  inclusions,
  exclusions,
  locale,
}: {
  inclusions: LocalizedText[]
  exclusions: LocalizedText[]
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
    </Frame>
  )
}
