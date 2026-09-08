import { Media } from '@/components/media/Media'
import type { HomeContent } from '@/lib/content'

/**
 * NGƯỜI DẪN ĐƯỜNG — ảnh tròn cạnh một đoạn tự giới thiệu ngắn.
 *
 * Khối nhỏ nhất trang, và là khối quan trọng nhất cho việc chốt khách. Trước
 * nó, toàn trang nói bằng "chúng tôi" — một pháp nhân vô danh. Đây là chỗ duy
 * nhất có một con người thật đứng ra chịu trách nhiệm cho chuyến đi, và với
 * dịch vụ đặt tour qua Zalo thì đó chính là thứ khách cần thấy trước khi nhắn
 * tin cho người lạ.
 *
 * Đặt NGAY DƯỚI biểu mẫu chứ không phải một section riêng ở giữa trang: nó
 * trả lời câu hỏi "mình đang gửi thông tin cho ai đây" đúng vào lúc câu hỏi
 * đó xuất hiện trong đầu người đọc.
 *
 * Nền ink-900 (kem đậm hơn nền trang một bậc) là lần DUY NHẤT trên site có
 * một khối đổ nền đặc. Chính vì hiếm nên nó đủ để tách khối này ra mà không
 * cần thêm viền hay bóng.
 */
export function Guide({
  guide,
  locale,
  className = '',
}: {
  guide: NonNullable<HomeContent['guide']>
  locale: 'vi' | 'en'
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center gap-6 bg-ink-900 p-8 sm:flex-row sm:p-10 ${className}`}>
      {guide.photo && (
        <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
          <Media media={guide.photo} locale={locale} fill sizes="96px" className="object-cover" />
        </span>
      )}
      <div className="text-center sm:text-left">
        <p className="text-label uppercase text-ink-500">
          {guide.name} · {guide.role[locale] ?? guide.role.vi}
        </p>
        <p className="mt-3 text-meta text-sand-200">{guide.bio[locale] ?? guide.bio.vi}</p>
      </div>
    </div>
  )
}
