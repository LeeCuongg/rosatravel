import type { ReactNode } from 'react'

/**
 * KHUNG NÉT ĐỨT + NHÃN — primitive bố cục dùng lại cho MỌI khối trên site.
 *
 * Đây là chi tiết chữ ký của toàn bộ thiết kế, lấy từ spotstravel.co: mỗi khối
 * nội dung nằm trong một khung viền nét đứt 1px, và tên khối là một dòng chữ
 * hoa nhỏ nằm trong dải riêng phía trên, ngăn bằng chính đường nét đứt đó.
 *
 * Vì sao phải là primitive chứ không copy class ở từng section: cảm giác "tạp
 * chí" chỉ xuất hiện khi MỌI khung dùng chung một độ dày, một màu, một khoảng
 * đệm. Chỉ cần một section lệch 1px hoặc lệch màu là mắt đọc ra ngay và cả hệ
 * thống trông như dựng tạm.
 *
 * Ba lựa chọn bề rộng ứng với ba loại nội dung, không được chọn bừa:
 *   sml (900px)  — chữ dài để đọc. Rộng hơn là mỗi dòng quá nhiều chữ, mắt
 *                  lạc dòng khi xuống hàng.
 *   med (1200px) — lưới ảnh, bảng, biểu mẫu. Mặc định.
 *   lge (1800px) — dải ảnh lớn cần thoáng.
 */
const WIDTHS = {
  sml: 'max-w-sml',
  med: 'max-w-med',
  lge: 'max-w-lge',
} as const

interface FrameProps {
  children: ReactNode
  /** Nhãn chữ hoa nhỏ ở dải trên cùng. Bỏ trống thì khung không có dải nhãn. */
  label?: string
  width?: keyof typeof WIDTHS
  /** Class thêm cho vùng nội dung bên trong khung (không phải cho khung). */
  bodyClassName?: string
  /** Đặt id để liên kết neo (#...) nhảy tới được. */
  id?: string
}

export function Frame({ children, label, width = 'med', bodyClassName = 'p-8 sm:p-12', id }: FrameProps) {
  return (
    <section id={id} className="px-gutter py-section">
      <div className={`mx-auto ${WIDTHS[width]} border border-dashed border-rule`}>
        {label && (
          <div className="border-b border-dashed border-rule px-6 py-4 text-center">
            <Eyebrow>{label}</Eyebrow>
          </div>
        )}
        <div className={bodyClassName}>{children}</div>
      </div>
    </section>
  )
}

/**
 * Nhãn chữ hoa nhỏ. Luôn dùng font sans (KHÔNG serif) — sự tương phản giữa
 * nhãn sans bé xíu và tiêu đề serif khổng lồ chính là thứ tạo nhịp cho trang.
 * Cỡ và độ giãn chữ nằm trong token `text-label`, đừng ghi đè tại chỗ.
 */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-sans text-label text-ink-500 uppercase ${className}`}>{children}</p>
  )
}

/**
 * Đường kẻ ngang nét đứt, dùng để ngăn các hàng bên TRONG một khung.
 *
 * Dùng `<div role="separator">` chứ không phải `<hr>`: đường này thuần trang
 * trí, còn `<hr>` mang ngữ nghĩa "chuyển chủ đề" và bị trình đọc màn hình đọc
 * lên. Một trang có hai chục cái `<hr>` là hai chục lần ngắt lời vô nghĩa.
 */
export function Rule({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`border-t border-dashed border-rule ${className}`} />
}
