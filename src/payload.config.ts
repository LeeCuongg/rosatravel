import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { vi } from '@payloadcms/translations/languages/vi'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

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
  // Giao diện admin bằng tiếng Việt cho nhân viên nhập liệu.
  i18n: {
    supportedLanguages: { vi },
    fallbackLanguage: 'vi',
  },
  // Bật localization ngay từ đầu dù mới có tiếng Việt: field `localized: true`
  // lưu theo dạng { vi: ... }, nên thêm `en` về sau chỉ là thêm locale và dịch,
  // không phải migrate dữ liệu.
  localization: {
    locales: [{ code: 'vi', label: 'Tiếng Việt' }],
    defaultLocale: 'vi',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),
  sharp,
  plugins: [
    // Không có token (vd. chạy test) thì Media lưu file local thay vì lên Blob.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
