import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withPayload } from '@payloadcms/next/withPayload'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Tắt tối ưu ảnh của Vercel: bốn biến thể AVIF đã được sinh sẵn lúc upload
    // lên Payload (hook sharp, xem src/collections/Media.ts và
    // src/lib/media/variants.ts). Loader tuỳ biến chỉ suy URL biến thể từ URL
    // gốc trên Vercel Blob — xem src/lib/media/loader.ts.
    loader: 'custom',
    loaderFile: './src/lib/media/loader.ts',
    // Khớp đúng MEDIA_WIDTHS trong src/lib/media/loader.ts (và variants.ts).
    // Lệch hai danh sách này sẽ sinh srcset có mục trùng nhau.
    deviceSizes: [640, 1024, 1600, 2400],
  },
}

// Thứ tự bọc: đã thử cả hai — withPayload(withNextIntl(nextConfig)) và
// withNextIntl(withPayload(nextConfig)) — cả hai đều build và chạy được, route
// list sinh ra giống hệt nhau. Chọn withPayload bọc ngoài cùng vì đó là quy ước
// trong tài liệu Payload (export default withPayload(nextConfig)).
export default withPayload(withNextIntl(nextConfig))
