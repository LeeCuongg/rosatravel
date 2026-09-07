import path from 'path'
import { fileURLToPath } from 'url'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

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
  collections: [Users],
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
      // Chưa có collection nội dung nào dùng upload ở task này (Task 1 GĐ2).
      // Collection Media sẽ được thêm ở task sau và khai ở đây.
      collections: {},
      token: BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
