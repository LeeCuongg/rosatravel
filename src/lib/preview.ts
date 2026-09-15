import { routing } from '../i18n/routing'

export type PreviewTarget =
  | { collection: 'tours' | 'posts' | 'destinations' | 'tour-categories' | 'pages'; slug?: string | null }
  | { global: 'home' }

const collectionPaths = {
  tours: (slug: string) => `/tour/${slug}`,
  posts: (slug: string) => `/cam-nang/${slug}`,
  destinations: (slug: string) => `/diem-den/${slug}`,
  'tour-categories': (slug: string) => `/danh-muc/${slug}`,
  pages: (slug: string) => `/${slug}`,
} as const

/** Đường dẫn trên site của một tài liệu; `null` khi chưa có slug (chưa xem trước được). */
export function previewPath(target: PreviewTarget, locale?: string | null): string | null {
  let path: string
  if ('global' in target) {
    path = '/'
  } else {
    if (!target.slug) return null
    path = collectionPaths[target.collection](target.slug)
  }

  if (locale && locale !== routing.defaultLocale) {
    path = path === '/' ? `/${locale}` : `/${locale}${path}`
  }
  return path
}

/** URL mở chế độ xem bản nháp rồi chuyển tới trang (route `/next/preview`). */
export function previewUrl(path: string | null): string | null {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${base}/next/preview?path=${encodeURIComponent(path)}`
}
