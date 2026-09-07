import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withPayload } from '@payloadcms/next/withPayload'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Tắt tối ưu ảnh của Vercel: ảnh đã được sinh sẵn lúc build bằng sharp.
    // Xem scripts/build-media.ts và src/lib/media/loader.ts.
    loader: 'custom',
    loaderFile: './src/lib/media/loader.ts',
    // Khớp đúng MEDIA_WIDTHS trong src/lib/media/loader.ts. Lệch hai danh sách
    // này sẽ sinh srcset có mục trùng nhau.
    deviceSizes: [640, 1024, 1600, 2400],
  },
}

// Thứ tự bọc: đã thử cả hai — withPayload(withNextIntl(nextConfig)) và
// withNextIntl(withPayload(nextConfig)) — cả hai đều build và chạy được, route
// list sinh ra giống hệt nhau. Chọn withPayload bọc ngoài cùng vì đó là quy ước
// trong tài liệu Payload (export default withPayload(nextConfig)).
export default withPayload(withNextIntl(nextConfig))
