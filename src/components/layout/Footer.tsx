import { useTranslations } from 'next-intl'
import { Rule } from '@/components/ui/Frame'
import { TextLink } from '@/components/ui/TextLink'
import type { HomeContent } from '@/lib/content'

/**
 * Chân trang — một dòng chữ hoa nhỏ, không hơn.
 *
 * Spots kết thúc trang bằng đúng "© 2026 SPOTS TRAVEL" cao 33px. Cách này chỉ
 * hoạt động khi thông tin liên hệ đã được đặt ở một khối CÓ TRỌNG LƯỢNG phía
 * trên (ở đây là PlanTrip). Nếu ai đó gỡ khối đó đi, số điện thoại và email
 * phải quay lại footer — đừng để trang không còn chỗ nào liên hệ được.
 */
export function Footer({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('cta')
  const tb = useTranslations('brand')

  return (
    <footer className="px-gutter pb-10">
      <Rule />
      <div className="mx-auto mt-6 flex max-w-lge flex-col items-center gap-4 text-label uppercase text-ink-500 sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {tb('name')}
        </p>
        <div className="flex gap-6">
          <TextLink href={`tel:${contact.phone}`} size="sm" className="text-label uppercase">
            {t('callUs')}
          </TextLink>
          <TextLink href={`mailto:${contact.email}`} size="sm" className="text-label uppercase">
            {contact.email}
          </TextLink>
        </div>
      </div>
    </footer>
  )
}
