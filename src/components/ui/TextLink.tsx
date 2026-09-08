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

export function TextLink({ children, href, size = 'md', className = '' }: TextLinkProps) {
  const classes =
    `${SIZES[size]} underline decoration-rule-strong decoration-1 underline-offset-[0.3em] ` +
    `transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] ` +
    `hover:decoration-clay-500 hover:text-clay-500 ${className}`

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
