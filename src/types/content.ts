/**
 * Hình dạng dữ liệu mà component nhận vào. Mọi giá trị ở đây đến từ Payload
 * (nguyên tắc số 1, docs/ke-hoach-trien-khai.md mục 0) — component không tự
 * chứa nội dung. Giai đoạn 2 sẽ viết hàm ánh xạ document Payload sang các kiểu này.
 */

export type ImageAsset = {
  url: string
  alt: string
  width?: number | null
  height?: number | null
}

export type LinkItem = {
  label: string
  href: string
}

export type TourSummary = {
  id: string
  slug: string
  title: string
  coverImage: ImageAsset
  durationDays: number
  durationNights: number
  departureFrom: string
  /** Giá bán (VND). */
  price: number
  /** Giá gốc (VND); chỉ hiện gạch ngang khi lớn hơn `price`. */
  originalPrice?: number | null
  rating?: { average: number; count: number } | null
  bookedCount?: number | null
  /** Nhãn ngắn do nhân viên gắn, vd. "HOT", "Còn 5 chỗ". */
  badges?: string[] | null
}

export type MegaMenuGroup = {
  title: string
  href?: string | null
  links: LinkItem[]
}

export type NavItem = {
  label: string
  href: string
  /** Mục được làm nổi (nền primary), vd. chùm tour theo mùa. */
  highlight?: boolean | null
  megaMenu?: {
    groups: MegaMenuGroup[]
    featuredTours?: TourSummary[] | null
  } | null
}

export type ContactChannelKey = 'zalo' | 'messenger' | 'facebook' | 'instagram' | 'threads'

/** Global `site-settings` — mọi trường có thể trống; trống thì kênh đó bị ẩn. */
export type ContactSettings = {
  hotline?: string | null
  email?: string | null
} & Partial<Record<ContactChannelKey, string | null>>

export type FooterColumn = {
  title: string
  links: LinkItem[]
}
