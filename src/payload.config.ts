import path from 'path'
import { fileURLToPath } from 'url'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Users } from './collections/Users'

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
  collections: [Users, Media],
  editor: lexicalEditor(),
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
