import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withPayload } from '@payloadcms/next/withPayload'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  /**
   * Ba gói này KHÔNG được webpack đóng gói — Next `require()` thẳng chúng từ
   * node_modules lúc chạy.
   *
   * Lý do rất cụ thể: `@vercel/blob` (do @payloadcms/storage-vercel-blob kéo
   * vào) phụ thuộc `undici`. Ở chế độ dev, webpack tách nó thành
   * `.next/server/vendor-chunks/undici@6.28.1.js` nhưng KHÔNG phát ra file đó
   * cho mọi entry cần tới. Trang /lien-he vì thế vỡ với
   * `Cannot find module './vendor-chunks/undici@6.28.1.js'` → HTTP 500, trong
   * khi `next build` lại chạy tốt và prerender trang đó bình thường. Một lỗi
   * chỉ có ở dev là loại tệ nhất: nó làm mất niềm tin vào chính máy đang code.
   *
   * `mongoose` và `sharp` thêm vào cùng lý do phòng ngừa — cả hai đều là gói
   * Node thuần có binary/`require` động, thứ mà bundler không xử lý đúng.
   */
  serverExternalPackages: ['@vercel/blob', 'undici', 'mongoose', 'sharp'],

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
