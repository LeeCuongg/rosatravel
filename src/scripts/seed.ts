/**
 * Điền thông tin liên hệ ban đầu (docs/ke-hoach-trien-khai.md mục 6).
 * Chạy: pnpm payload run src/scripts/seed.ts
 *
 * Chỉ ghi khi "Cài đặt chung" còn trống, để chạy lại không đè lên những gì
 * nhân viên đã sửa trong admin. Không tạo tour/bài viết mẫu trong DB thật.
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const payload = await getPayload({ config })
const context = { disableRevalidate: true }

const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })

if (settings.hotline || settings.email || settings.zalo) {
  payload.logger.info('Cài đặt chung đã có dữ liệu, bỏ qua để không ghi đè.')
} else {
  await payload.updateGlobal({
    slug: 'site-settings',
    context,
    data: {
      hotline: '0973122807',
      email: 'lecuongg242@gmail.com',
      zalo: '0973122807',
      bookingPath: '/lien-he',
      bookingNotifyEmails: [{ email: 'lecuongg242@gmail.com' }],
      companyName: 'Rosa Travel',
      copyright: `© ${new Date().getFullYear()} Rosa Travel`,
    },
  })
  payload.logger.info('Đã điền thông tin liên hệ ban đầu vào Cài đặt chung.')
}

process.exit(0)
