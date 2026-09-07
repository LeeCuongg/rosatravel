import path from 'path'
import { fileURLToPath } from 'url'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { vi } from '@payloadcms/translations/languages/vi'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Tours } from './collections/Tours'
import { Users } from './collections/Users'
import { Home } from './globals/Home'

/**
 * Biến môi trường thiếu phải vỡ ồn ào, cùng khuôn mẫu với src/lib/site.ts của GĐ1.
 * Không làm thế này thì build vỡ với thông báo lỗi của driver Mongo, thứ không
 * nói cho ai biết phải làm gì.
 */
function required(name: string, huongDan: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} chưa được đặt. ${huongDan}\n` +
        'Đặt trong .env.local khi phát triển, và trong Vercel Project Settings → Environment Variables trước khi deploy.',
    )
  }
  return value
}

const MONGODB_URI = required(
  'MONGODB_URI',
  'Đây là chuỗi kết nối MongoDB Atlas — lấy ở Atlas → Connect → Drivers.',
)
const PAYLOAD_SECRET = required(
  'PAYLOAD_SECRET',
  'Chuỗi ngẫu nhiên dài dùng để ký phiên đăng nhập admin. Sinh bằng: openssl rand -base64 32',
)
const BLOB_READ_WRITE_TOKEN = required(
  'BLOB_READ_WRITE_TOKEN',
  'Token đọc/ghi của Vercel Blob — lấy ở Vercel → Storage → Blob.',
)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Tours],
  globals: [Home],
  editor: lexicalEditor(),
  // Việt hoá toàn bộ admin: nhãn, nút, điều hướng VÀ thông báo lỗi validate.
  // Không có khối này thì người nhập thấy nhãn tiếng Việt (đặt riêng ở từng
  // field) nhưng thông báo lỗi mặc định của Payload (vd. "This field requires
  // at least 1 Rows.") vẫn tiếng Anh — lỗ hổng mà Task 3 phát hiện.
  i18n: {
    supportedLanguages: { vi },
    fallbackLanguage: 'vi',
  },
  secret: PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: MONGODB_URI,
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: true,
      // addRandomSuffix PHẢI là false: loader ảnh (src/lib/media/loader.ts) suy
      // URL của mốc này từ mốc khác bằng biến đổi chuỗi thuần trên phần tên
      // chung. Payload đã tự chống trùng tên ở tầng trên (hero.jpg -> hero-1),
      // nên hậu tố ngẫu nhiên của Blob là thừa và sẽ phá vỡ quy ước đó — ảnh
      // 404 ở mọi breakpoint, không có test nào bắt được.
      addRandomSuffix: false,
      collections: {
        // disablePayloadAccessControl: true để trường `url` trỏ thẳng ra domain
        // public của Vercel Blob thay vì route proxy /api/media/file/<tên file>
        // của Payload. Mặc định (không đặt cờ này) mọi request ảnh phải qua
        // server Payload để proxy tới Blob — đúng cái chi phí runtime mà pipeline
        // ảnh của GĐ1 được sinh ra để triệt tiêu. Next/image loader (Task 7)
        // cũng cần URL Blob thật để suy ra bốn mốc bằng biến đổi chuỗi thuần.
        media: { disablePayloadAccessControl: true },
      },
      token: BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
