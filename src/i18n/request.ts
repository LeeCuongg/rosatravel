import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    // Cố định múi giờ để ngày khởi hành hiển thị giống nhau ở server và trình duyệt.
    timeZone: 'Asia/Ho_Chi_Minh',
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
