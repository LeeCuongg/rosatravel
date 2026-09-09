import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Link } from '@/i18n/navigation'

/**
 * LIÊN KẾT DẠNG CHỮ GẠCH CHÂN — CTA chuẩn của toàn site.
 *
 * Thay cho nút bo tròn nền cam. Nút pill màu nổi là quy ước của web dịch vụ /
 * thương mại điện tử; đặt nó cạnh chữ serif khổ lớn là phá vỡ tông biên tập
 * nhanh hơn bất cứ thứ gì khác. spotstravel.co không có lấy một nút đặc màu
 * nào ở luồng chính — mọi CTA đều là chữ gạch chân, kể cả "Plan Your Trip" ở
 * header.
 *
 * Gạch chân dùng `underline-offset` rộng và `decoration-1`: đây là lý do nó
 * trông như chữ trong sách chứ không như link mặc định của trình duyệt.
 */
interface TextLinkProps {
  children: ReactNode
  /** Đường dẫn nội bộ (đi qua next-intl Link) hoặc URL ngoài / tel: / mailto:. */
  href: string
  /** Cỡ chữ. `lg` cho CTA chính của một khối, `sm` cho liên kết phụ. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'text-meta',
  md: 'text-body',
  lg: 'font-display text-d3 text-clay-500',
} as const

/** Liên kết ngoài (http, tel, mailto) không đi qua router của next-intl được. */
function laLienKetNgoai(href: string): boolean {
  return /^(https?:|tel:|mailto:|#)/.test(href)
}

/**
 * Bộ class dùng chung cho TextLink và TextButton. Tách ra vì hai thành phần
 * PHẢI trông giống hệt nhau: người đọc không phân biệt được đâu là liên kết
 * đâu là nút, và cũng không cần phân biệt — họ chỉ thấy một dòng chữ gạch chân
 * bấm được. Chép class sang chỗ khác là chắc chắn có ngày lệch nhau.
 */
function lopChuGachChan(size: keyof typeof SIZES, className: string): string {
  return (
    `${SIZES[size]} underline decoration-rule-strong decoration-1 underline-offset-[0.3em] ` +
    `transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] ` +
    `hover:decoration-clay-500 hover:text-clay-500 ${className}`
  )
}

export function TextLink({ children, href, size = 'md', className = '' }: TextLinkProps) {
  const classes = lopChuGachChan(size, className)

  if (laLienKetNgoai(href)) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}

/**
 * CÙNG DÁNG với TextLink nhưng là <button> thật.
 *
 * Dùng khi thao tác KHÔNG đi đâu cả — mở hộp thoại, bật/tắt một khối. Chỗ đó
 * mà đặt <a> thì trình đọc màn hình thông báo "liên kết", người dùng chờ được
 * chuyển trang; chuột giữa mở tab mới ra một URL vô nghĩa; và Space không kích
 * hoạt được. Ngược lại, <button> cho một điều hướng thật thì mất Ctrl+click,
 * mất preview đường dẫn ở thanh trạng thái, và Google không lần theo được.
 */
export function TextButton({
  children,
  size = 'md',
  className = '',
  ...props
}: ComponentPropsWithoutRef<'button'> & { size?: keyof typeof SIZES }) {
  return (
    <button type="button" {...props} className={lopChuGachChan(size, className)}>
      {children}
    </button>
  )
}

/**
 * Nút đặc màu — CÒN ĐÚNG MỘT chỗ được phép dùng: nút submit của biểu mẫu.
 * Ở đó nó không phải trang trí mà là tín hiệu "đây là hành động cuối cùng",
 * và người dùng cần thấy rõ vùng bấm. Spots cũng làm y hệt (nút "Send via
 * Email" xanh rêu đặc, giữa một trang không có nút nào khác).
 */
export function SubmitButton({
  children,
  className = '',
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      {...props}
      className={
        `rounded-full bg-clay-600 text-on-clay px-8 py-3 text-meta font-medium ` +
        `transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-hover)] ` +
        `hover:opacity-85 disabled:opacity-50 ${className}`
      }
    >
      {children}
    </button>
  )
}
