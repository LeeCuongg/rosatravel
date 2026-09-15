import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { vi } from '@payloadcms/translations/languages/vi'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Banners } from './collections/Banners'
import { BookingRequests } from './collections/BookingRequests'
import { Clients } from './collections/Clients'
import { Destinations } from './collections/Destinations'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Reviews } from './collections/Reviews'
import { TourCategories } from './collections/TourCategories'
import { Tours } from './collections/Tours'
import { Users } from './collections/Users'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { Home } from './globals/Home'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Rosa Travel',
    },
    // Khung xem trước trực tiếp khi sửa tour, bài viết, trang, trang chủ.
    livePreview: {
      breakpoints: [
        { label: 'Điện thoại', name: 'mobile', width: 390, height: 844 },
        { label: 'Máy tính bảng', name: 'tablet', width: 768, height: 1024 },
        { label: 'Máy tính', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  // Thứ tự ở đây là thứ tự trong thanh bên của admin (trong từng nhóm).
  collections: [
    Tours,
    Destinations,
    TourCategories,
    BookingRequests,
    Posts,
    Pages,
    Banners,
    Reviews,
    Clients,
    Media,
    Users,
  ],
  globals: [Home, Header, Footer, SiteSettings],
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
    // Không có token, hoặc DISABLE_BLOB_STORAGE=true (DB QA, test), thì Media lưu file
    // local thay vì lên Blob thật. Cần công tắc riêng vì trong PowerShell gán biến môi
    // trường thành chuỗi rỗng là xóa biến, Payload lại đọc token từ .env.local.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.DISABLE_BLOB_STORAGE !== 'true',
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
