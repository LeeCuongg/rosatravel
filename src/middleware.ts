import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // admin: đường dẫn của Payload (/admin, /admin/**) — không phải trang có locale.
  // Không loại trừ thì next-intl redirect /admin -> /vi/admin, Payload không có
  // route đó nên vỡ. Xem task-1-report.md.
  matcher: ['/', '/(vi|en)/:path*', '/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
