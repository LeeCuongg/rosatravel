import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

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

export default withNextIntl(nextConfig)
