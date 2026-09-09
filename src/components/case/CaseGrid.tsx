import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { Frame } from '@/components/ui/Frame'
import { stagger } from '@/lib/motion/tokens'
import type { CaseStudy } from '@/lib/content'

/**
 * KHỐI "CHUYẾN ĐÃ ĐI" trên trang chủ — ảnh cắt tròn, tên bên dưới.
 *
 * Ảnh TRÒN là lựa chọn có chủ đích, không phải trang trí. Mọi ảnh khác trên
 * site đều là hình chữ nhật; bốn hình tròn ở giữa trang tự tách mình ra và
 * báo cho người đọc rằng đây là loại nội dung khác — không phải sản phẩm đang
 * bán như lưới tour phía trên. Hình tròn cũng xoá bỏ khác biệt tỉ lệ giữa các
 * ảnh, nên bốn thẻ luôn cân nhau bất kể người nhập chọn ảnh gì.
 *
 * Thẻ là <Link> tới /chuyen-di/<slug>, KHÔNG phải <button> mở lớp phủ bằng
 * state. Nhờ vậy nó vẫn là một liên kết thật: mở tab mới được, copy link
 * được, Google theo được. Việc biến nó thành lớp phủ do intercepting route
 * của Next lo — xem src/app/[locale]/@modal.
 */
export function CaseGrid({
  cases,
  locale,
}: {
  cases: CaseStudy[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('sections')
  const tc = useTranslations('cta')

  // Chưa viết bài nào thì không dựng khung rỗng.
  if (cases.length === 0) return null

  return (
    <Frame id="chuyen-da-di" label={t('caseStudies')} bodyClassName="">
      <div className="grid divide-y divide-dashed divide-rule sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
        {cases.map((item, index) => (
          <Reveal key={item.slug} delay={index * stagger}>
            {/* Đệm nằm trên <Link> chứ không trên ô lưới: có thế cả ô mới LÀ
                vùng bấm, và bóng đổ lúc hover mới bao trọn ô thay vì chỉ ôm
                lấy hình tròn với dòng chữ. `h-full` để bốn thẻ cao bằng nhau
                kể cả khi một tên chuyến xuống hai dòng. */}
            <Link
              href={`/chuyen-di/${item.slug}`}
              data-accent={item.accent}
              className="group relative flex h-full flex-col items-center p-8 text-center shadow-card-off transition-shadow duration-[var(--duration-base)] ease-[var(--ease-hover)] hover:z-10 hover:shadow-card sm:p-6"
            >
              <div className="relative w-full max-w-[13rem]">
                {/* Ảnh CO LẠI khi hover, không phóng to.
                    Phóng to là phản xạ mặc định và nó sai ở đây: hình tròn
                    phình ra sẽ lấn vào vách ngăn nét đứt của ô bên cạnh. Co lại
                    kèm bóng đổ cho ra cảm giác nút bị ấn xuống, và chừa đúng
                    khoảng trống để cái nhãn bên dưới hiện ra mà không đè lên
                    chủ thể trong ảnh. Đây cũng là cách spotstravel.co làm — đã
                    đo: scale(.95) + shadow, 0.5s. */}
                {/* `transition-[scale,...]` chứ KHÔNG phải `transition-[transform,...]`.
                    Tailwind v4 sinh ra `scale: .95` — thuộc tính CSS RIÊNG — chứ
                    không phải `transform: scale(.95)`. Khai transform trong danh
                    sách tự viết thì trình duyệt không thấy `scale` trong đó và
                    ảnh nhảy cóc sang kích thước mới, không có chuyển động nào.
                    Đã đo: computed `transform` là `none` còn `scale` là `0.95`.
                    (Tiện ích `transition-transform` có sẵn thì an toàn — nó khai
                    đủ `transform, translate, scale, rotate`. Chỉ danh sách tự
                    viết mới dính bẫy này.) */}
                <div className="relative aspect-square overflow-hidden rounded-full shadow-card-off transition-[scale,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-hover)] group-hover:scale-95 group-hover:shadow-card">
                  <Media
                    media={item.thumbnail}
                    locale={locale}
                    fill
                    // Bốn cột trong khung 1200px trừ đệm => ô dừng ở ~208px.
                    sizes="(max-width: 640px) 60vw, 208px"
                    className="object-cover"
                  />
                </div>

                {/* Nhãn "Chi tiết" nổi giữa ảnh.
                    `aria-hidden` + `pointer-events-none`: nó chỉ nhắc lại điều
                    mà chính thẻ <Link> bọc ngoài đã nói. Không ẩn đi thì trình
                    đọc màn hình đọc "Tam giác mạch cho một nhóm bạn... Chi
                    tiết" như hai đích đến khác nhau, và con trỏ chuột đổi hình
                    khi lướt qua nó giữa một vùng vốn đã bấm được cả mảng.
                    Bọc trong một div `grid place-items-center` thay vì tự căn
                    bằng transform: nhãn cần dành riêng transform cho động tác
                    NHÍCH LÊN của mình, không chia sẻ với việc căn giữa. */}
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span
                    aria-hidden
                    className="translate-y-1 rounded-full bg-accent px-5 py-2 text-label uppercase text-ink-950 opacity-0 transition-[opacity,translate] duration-[var(--duration-base)] ease-[var(--ease-hover)] group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    {tc('viewCase')}
                  </span>
                </div>
              </div>
              <h3 className="font-display mt-6 text-d4 transition-colors duration-[var(--duration-base)] ease-[var(--ease-hover)] group-hover:text-accent">
                {item.title[locale] ?? item.title.vi}
              </h3>
              <p className="mt-2 text-meta text-ink-500">
                {item.subtitle[locale] ?? item.subtitle.vi}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </Frame>
  )
}
