import { defineRouting } from 'next-intl/routing'

// Thêm ngôn ngữ: bổ sung vào `locales`, tạo messages/<locale>.json và thêm
// locale tương ứng trong `localization` của payload.config.ts.
export const routing = defineRouting({
  locales: ['vi'],
  defaultLocale: 'vi',
  // Tiếng Việt không có tiền tố (/tour/ha-giang); ngôn ngữ khác là /en/tour/...
  localePrefix: 'as-needed',
})
