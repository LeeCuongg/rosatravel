import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { TextLink } from '@/components/ui/TextLink'
import type { HomeContent } from '@/lib/content'

/**
 * Thanh điều hướng — dải kem đặc, viền dưới nét đứt, đứng yên trên đầu trang.
 *
 * Đây là bản viết lại hoàn toàn so với GĐ2. Bản cũ là header `fixed` trong
 * suốt, có nền tối mờ dần theo vị trí cuộn (motion + useScroll + đo tier thiết
 * bị). Bỏ hết vì hai lý do:
 *
 *  1. Toàn bộ hiệu ứng đó chỉ tồn tại để header đọc được khi nằm ĐÈ lên ảnh
 *     hero. Hero trang chủ giờ là nền kem, không còn ảnh để đè, nên cả cơ chế
 *     mất lý do tồn tại — kể cả cờ `measured` từng phải thêm để chặn lỗi nháy
 *     một thanh tối lên hero ở lần vẽ đầu.
 *  2. `fixed` buộc MỌI trang phải tự chừa khoảng trống trên đỉnh (trang liên hệ
 *     từng phải `pt-40`). `sticky` chiếm chỗ thật trong luồng nên không trang
 *     nào phải biết header cao bao nhiêu nữa.
 *
 * Kèm theo đó header không còn là client component — không hook, không state.
 *
 * Không còn nút Zalo nền cam. Nó là chi tiết phá tông mạnh nhất của bản cũ:
 * một nút pill màu bão hoà cạnh chữ serif khổ lớn kéo cả trang về hạng "web
 * dịch vụ". Zalo vẫn ở đây, dưới dạng chữ gạch chân — và vẫn là mục nổi bật
 * nhất bên phải nhờ vách ngăn nét đứt tách riêng nó khỏi nhóm liên kết.
 */
export function Header({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('nav')
  const tc = useTranslations('cta')
  const tb = useTranslations('brand')

  return (
    <header className="sticky top-0 z-50 border-b border-dashed border-rule bg-ink-950">
      <div className="mx-auto flex max-w-lge items-stretch justify-between px-gutter">
        {/* Nhỏ hơn một bậc trên điện thoại. Ở 390px, tên thương hiệu cỡ 24px
            ngốn hết một phần ba bề ngang và đẩy toàn bộ điều hướng ra ngoài. */}
        <Link
          href="/"
          className="font-display py-4 text-[1.375rem] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:text-clay-500 sm:text-d4"
        >
          {tb('name')}
        </Link>

        <div className="flex items-stretch gap-4 sm:gap-6">
          {/* Trên điện thoại chỉ đủ chỗ cho MỘT liên kết bên cạnh Zalo, nên
              "Liên hệ" bị ẩn — không phải vì nó không quan trọng mà vì trang
              đã có hai lối liên hệ khác nằm ngay trong luồng đọc: biểu mẫu ở
              cuối trang chủ và số điện thoại ở chân trang. "Hành trình" thì
              không có lối nào khác thay thế, nên nó ở lại. */}
          <nav className="flex items-center gap-4 text-label uppercase sm:gap-6 sm:text-meta sm:normal-case">
            <Link
              href="/#hanh-trinh"
              className="transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:text-clay-500"
            >
              {t('journeys')}
            </Link>
            <Link
              href="/lien-he"
              className="hidden transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:text-clay-500 sm:inline"
            >
              {t('contact')}
            </Link>
          </nav>

          {/* Vách ngăn dọc nét đứt — cùng ngôn ngữ với khung Frame. Chạy hết
              chiều cao header (nhờ items-stretch ở hai cấp cha) nên nó là một
              đường liền mạch với viền dưới, không phải một gạch lơ lửng. */}
          <div aria-hidden className="border-l border-dashed border-rule" />

          <div className="flex items-center">
            <TextLink href={contact.zaloUrl} size="sm">
              {tc('zalo')}
            </TextLink>
          </div>
        </div>
      </div>
    </header>
  )
}
