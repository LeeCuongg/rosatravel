import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Bỏ qua admin và API của Payload, route xem trước (/next/*), nội bộ Next/Vercel
  // và mọi file tĩnh (có dấu chấm).
  matcher: ['/((?!admin|api|next|_next|_vercel|.*\\..*).*)'],
}
