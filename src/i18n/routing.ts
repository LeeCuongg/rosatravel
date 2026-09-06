import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // GĐ1 chỉ ship tiếng Việt. Thêm 'en' vào đây là bật được ngôn ngữ thứ hai.
  locales: ['vi'],
  defaultLocale: 'vi',
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]
