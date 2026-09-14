import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Bỏ qua admin và API của Payload, nội bộ Next/Vercel và mọi file tĩnh (có dấu chấm).
  matcher: ['/((?!admin|api|_next|_vercel|.*\\..*).*)'],
}
