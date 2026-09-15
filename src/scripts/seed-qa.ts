/**
 * Dữ liệu MẪU để dev xem giao diện các trang. KHÔNG dùng cho database thật:
 * script từ chối chạy nếu tên database không có chữ "qa".
 *
 * PowerShell (ảnh lưu ra thư mục local thay vì Vercel Blob thật):
 *   $env:MONGODB_URI = '<uri trỏ tới database rosatravel_qa>'
 *   $env:DISABLE_BLOB_STORAGE = 'true'
 *   pnpm payload run src/scripts/seed-qa.ts
 *
 * Dev server xem dữ liệu QA cũng phải chạy với hai biến trên.
 * Chạy lại sẽ xóa dữ liệu mẫu cũ trong DB QA rồi tạo lại.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload, type CollectionSlug } from 'payload'

import type { RichTextBlock } from '../payload-types'
import config from '../payload.config'

const dbName = (() => {
  try {
    return new URL(process.env.MONGODB_URI ?? '').pathname.replace(/^\//, '')
  } catch {
    return ''
  }
})()

if (!/qa/i.test(dbName)) {
  console.error(`Từ chối chạy: database "${dbName || '(không rõ)'}" không phải database QA.`)
  process.exit(1)
}

// Ảnh mẫu không được lên Vercel Blob thật (Blob dùng chung với site thật).
if (process.env.BLOB_READ_WRITE_TOKEN && process.env.DISABLE_BLOB_STORAGE !== 'true') {
  console.error('Từ chối chạy: Vercel Blob đang bật. Đặt $env:DISABLE_BLOB_STORAGE = "true" trước khi chạy.')
  process.exit(1)
}

type RichTextValue = RichTextBlock['content']

function richText(...paragraphs: string[]): RichTextValue {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
      })),
    },
  }
}

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const payload = await getPayload({ config })
const context = { disableRevalidate: true }
const published = { _status: 'published' as const }

const collections: CollectionSlug[] = [
  'tours',
  'destinations',
  'tour-categories',
  'banners',
  'reviews',
  'posts',
  'pages',
  'clients',
  'media',
]
for (const collection of collections) {
  await payload.delete({ collection, where: { id: { exists: true } }, context })
}

const images = []
for (const [index, alt] of ['Núi đồi lúc hoàng hôn', 'Bờ biển xanh', 'Đồi cát và mặt trời', 'Đồi mùa thu'].entries()) {
  images.push(
    await payload.create({
      collection: 'media',
      data: { alt },
      filePath: path.join(root, 'public', 'ui-kit', `tour-${index + 1}.jpg`),
      context,
    }),
  )
}
const [imgMountain, imgSea, imgDune, imgAutumn] = images

const destinations = {
  haGiang: await payload.create({
    collection: 'destinations',
    data: { ...published, name: 'Hà Giang', slug: 'ha-giang', region: 'north', coverImage: imgMountain.id, summary: 'Cao nguyên đá và những cung đèo quanh co.' },
    context,
  }),
  daNang: await payload.create({
    collection: 'destinations',
    data: { ...published, name: 'Đà Nẵng', slug: 'da-nang', region: 'central', coverImage: imgSea.id, summary: 'Biển dài, phố cổ Hội An ngay cạnh.' },
    context,
  }),
  phuQuoc: await payload.create({
    collection: 'destinations',
    data: { ...published, name: 'Phú Quốc', slug: 'phu-quoc', region: 'south', coverImage: imgDune.id, summary: 'Đảo ngọc với hoàng hôn rực rỡ.' },
    context,
  }),
  hanQuoc: await payload.create({
    collection: 'destinations',
    data: { ...published, name: 'Hàn Quốc', slug: 'han-quoc', region: 'asia', coverImage: imgAutumn.id, summary: 'Mùa thu lá đỏ ở Seoul và Nami.' },
    context,
  }),
}

const categories = {
  autumn: await payload.create({
    collection: 'tour-categories',
    data: { name: 'Tour mùa thu', slug: 'tour-mua-thu', kind: 'season', order: 1, coverImage: imgAutumn.id },
    context,
  }),
  domestic: await payload.create({
    collection: 'tour-categories',
    data: { name: 'Tour trong nước', slug: 'tour-trong-nuoc', kind: 'region', order: 2, coverImage: imgMountain.id },
    context,
  }),
  international: await payload.create({
    collection: 'tour-categories',
    data: { name: 'Tour nước ngoài', slug: 'tour-nuoc-ngoai', kind: 'region', order: 3, coverImage: imgSea.id },
    context,
  }),
}

function tourLayout(place: string) {
  return [
    {
      blockType: 'highlights' as const,
      items: [
        { text: `Ngắm cảnh đẹp nhất ${place} vào thời điểm lý tưởng` },
        { text: 'Hướng dẫn viên địa phương đi cùng suốt hành trình' },
        { text: 'Khách sạn trung tâm, thuận tiện đi lại' },
        { text: 'Nhóm nhỏ, lịch trình không vội vã' },
      ],
    },
    {
      blockType: 'itinerary' as const,
      days: [
        {
          title: `Khởi hành – ${place}`,
          meals: ['lunch', 'dinner'] as ('lunch' | 'dinner')[],
          content: richText('Đón khách tại điểm hẹn, di chuyển tới điểm đến.', 'Chiều nhận phòng, tự do khám phá.'),
        },
        {
          title: `Khám phá ${place}`,
          meals: ['breakfast', 'lunch', 'dinner'] as ('breakfast' | 'lunch' | 'dinner')[],
          content: richText('Tham quan các điểm nổi bật cùng hướng dẫn viên.', 'Tối thưởng thức đặc sản địa phương.'),
          images: [imgMountain.id, imgSea.id],
        },
        {
          title: 'Trở về',
          meals: ['breakfast'] as 'breakfast'[],
          content: richText('Mua sắm quà lưu niệm, trả phòng và về lại điểm đón.'),
        },
      ],
    },
    {
      blockType: 'inclusions' as const,
      included: [{ text: 'Xe đưa đón suốt tuyến' }, { text: 'Khách sạn 3 sao' }, { text: 'Bữa ăn theo lịch trình' }],
      excluded: [{ text: 'Chi phí cá nhân' }, { text: 'Thuế VAT' }],
    },
    {
      blockType: 'priceTable' as const,
      rows: [
        { label: 'Người lớn', price: 3180000 },
        { label: 'Trẻ em 5–10 tuổi', price: 2390000, note: 'Ngủ chung giường với bố mẹ' },
        { label: 'Trẻ em dưới 5 tuổi', note: 'Miễn phí' },
      ],
    },
    {
      blockType: 'faq' as const,
      items: [
        { question: 'Tour có phù hợp với trẻ nhỏ không?', answer: richText('Có, lịch trình nhẹ nhàng và có thời gian nghỉ.') },
        { question: 'Có thể đổi ngày khởi hành không?', answer: richText('Được, báo trước ít nhất 7 ngày.') },
      ],
    },
    {
      blockType: 'policy' as const,
      title: 'Chính sách hủy tour',
      content: richText('Hủy trước 15 ngày: hoàn 100% tiền cọc.', 'Hủy trong vòng 7 ngày: không hoàn cọc.'),
    },
  ]
}

const tourData = [
  { title: 'Tour Hà Giang 3 ngày 2 đêm: cung đèo và cao nguyên đá', slug: 'tour-ha-giang-3n2d', image: imgMountain, place: 'Hà Giang', price: 3180000, originalPrice: 3490000, days: 3, destination: destinations.haGiang, category: categories.domestic, featured: true, trending: true, badges: [{ text: 'HOT' }] },
  { title: 'Tour Đà Nẵng – Hội An 4 ngày 3 đêm', slug: 'tour-da-nang-hoi-an-4n3d', image: imgSea, place: 'Đà Nẵng', price: 5290000, originalPrice: null, days: 4, destination: destinations.daNang, category: categories.domestic, featured: true, trending: false, badges: [] },
  { title: 'Tour Phú Quốc 3 ngày 2 đêm nghỉ dưỡng biển', slug: 'tour-phu-quoc-3n2d', image: imgDune, place: 'Phú Quốc', price: 4590000, originalPrice: 4990000, days: 3, destination: destinations.phuQuoc, category: categories.domestic, featured: true, trending: true, badges: [{ text: 'Còn 5 chỗ' }] },
  { title: 'Tour Hàn Quốc 5 ngày 4 đêm mùa thu lá đỏ', slug: 'tour-han-quoc-mua-thu-5n4d', image: imgAutumn, place: 'Seoul', price: 15990000, originalPrice: 17490000, days: 5, destination: destinations.hanQuoc, category: categories.international, featured: true, trending: false, badges: [] },
  { title: 'Tour Sa Pa 2 ngày 1 đêm', slug: 'tour-sa-pa-2n1d', image: imgMountain, place: 'Sa Pa', price: 2190000, originalPrice: null, days: 2, destination: destinations.haGiang, category: categories.autumn, featured: false, trending: true, badges: [] },
]

for (const tour of tourData) {
  await payload.create({
    collection: 'tours',
    context,
    data: {
      ...published,
      title: tour.title,
      slug: tour.slug,
      summary: `Hành trình ${tour.days} ngày khám phá ${tour.place}, lịch trình thong thả, dịch vụ chu đáo.`,
      coverImage: tour.image.id,
      gallery: [imgMountain.id, imgSea.id, imgDune.id, imgAutumn.id],
      durationDays: tour.days,
      durationNights: tour.days - 1,
      departureFrom: 'Hà Nội',
      destinations: [tour.destination.id],
      categories: [tour.category.id, categories.autumn.id],
      badges: tour.badges,
      price: tour.price,
      originalPrice: tour.originalPrice,
      departures: [
        { date: daysFromNow(-5), status: 'available' },
        { date: daysFromNow(9), status: 'available' },
        { date: daysFromNow(16), status: 'limited', seatsLeft: 4 },
        { date: daysFromNow(30), status: 'available', price: tour.price + 300000 },
        { date: daysFromNow(44), status: 'soldout' },
      ],
      layout: tourLayout(tour.place),
      isFeatured: tour.featured,
      isTrending: tour.trending,
      stats: { ratingAverage: 4.8, ratingCount: 36, bookedCount: 210 },
    },
  })
}

for (const [index, banner] of [
  { title: 'Hero mùa thu', placement: 'hero' as const, image: imgAutumn, href: '/danh-muc/tour-mua-thu' },
  { title: 'Hero biển', placement: 'hero' as const, image: imgSea, href: '/diem-den/da-nang' },
  { title: 'Khuyến mãi 1', placement: 'promo' as const, image: imgDune, href: '/tour/tour-phu-quoc-3n2d' },
  { title: 'Khuyến mãi 2', placement: 'promo' as const, image: imgMountain, href: '/tour/tour-ha-giang-3n2d' },
  { title: 'Khuyến mãi 3', placement: 'promo' as const, image: imgSea, href: null },
].entries()) {
  await payload.create({ collection: 'banners', context, data: { ...banner, image: banner.image.id, order: index, active: true } })
}

for (const review of [
  { customerName: 'Chị Lan', location: 'Hà Nội', quote: 'Lịch trình hợp lý, hướng dẫn viên nhiệt tình, cả nhà đều vui.' },
  { customerName: 'Anh Minh', location: 'TP. Hồ Chí Minh', quote: 'Khách sạn đẹp, đồ ăn ngon, sẽ đặt tiếp chuyến sau.' },
  { customerName: 'Gia đình chị Hoa', location: 'Hải Phòng', quote: 'Tư vấn nhanh, đổi ngày khởi hành cũng rất dễ dàng.' },
]) {
  await payload.create({ collection: 'reviews', context, data: { ...review, rating: 5, approved: true } })
}

for (const [index, post] of [
  { title: 'Kinh nghiệm đi Hà Giang mùa lúa chín', image: imgMountain },
  { title: 'Chuẩn bị gì cho chuyến biển đầu tiên', image: imgSea },
  { title: 'Mùa thu Hàn Quốc: nên đi tháng nào', image: imgAutumn },
  { title: 'Ăn gì ở Phú Quốc', image: imgDune },
].entries()) {
  await payload.create({
    collection: 'posts',
    context,
    data: {
      ...published,
      title: post.title,
      slug: `bai-mau-${index + 1}`,
      category: 'guide',
      coverImage: post.image.id,
      excerpt: 'Bài viết mẫu để xem giao diện thẻ bài viết trên trang chủ.',
      content: richText('Nội dung mẫu đoạn 1.', 'Nội dung mẫu đoạn 2.'),
      publishedAt: daysFromNow(-index),
    },
  })
}

await payload.create({
  collection: 'pages',
  context,
  data: {
    ...published,
    title: 'Giới thiệu',
    slug: 'gioi-thieu',
    layout: [
      { blockType: 'richText', content: richText('Trang tĩnh mẫu dựng bằng khối.') },
      { blockType: 'faq', items: [{ question: 'Văn phòng ở đâu?', answer: richText('Hà Nội.') }] },
    ],
  },
})

await payload.updateGlobal({
  slug: 'home',
  context,
  data: {
    ...published,
    layout: [
      { blockType: 'heroBanners', showSearch: true },
      {
        blockType: 'usp',
        items: [
          { icon: 'support', title: 'Hỗ trợ 24/7', description: 'Luôn có người nghe máy.' },
          { icon: 'quality', title: 'Dịch vụ chọn lọc', description: 'Khách sạn, xe, nhà hàng đã kiểm tra.' },
          { icon: 'price', title: 'Giá minh bạch', description: 'Không phát sinh phí ẩn.' },
          { icon: 'safety', title: 'An toàn', description: 'Bảo hiểm du lịch cho mọi khách.' },
        ],
      },
      { blockType: 'tourCarousel', eyebrow: 'Mùa này đi đâu', title: 'Tour nổi bật', source: 'featured', limit: 8, viewAll: { href: '/danh-muc/tour-mua-thu' } },
      { blockType: 'categoryTiles', title: 'Danh mục tour', categories: [categories.autumn.id, categories.domestic.id, categories.international.id] },
      { blockType: 'promoBanners', title: 'Khuyến mãi' },
      { blockType: 'tourCarousel', title: 'Tour trong nước', source: 'category', category: categories.domestic.id, limit: 8 },
      { blockType: 'destinationGrid', eyebrow: 'Khám phá', title: 'Điểm đến được yêu thích', destinations: Object.values(destinations).map((d) => d.id) },
      { blockType: 'reviews', title: 'Khách hàng nói gì', limit: 6 },
      { blockType: 'posts', title: 'Cẩm nang du lịch', limit: 4, viewAll: { href: '/cam-nang' } },
    ],
  },
})

await payload.updateGlobal({
  slug: 'header',
  context,
  data: {
    navItems: [
      { label: 'Tour mùa thu', href: '/danh-muc/tour-mua-thu', highlight: true },
      {
        label: 'Tour trong nước',
        href: '/danh-muc/tour-trong-nuoc',
        hasMegaMenu: true,
        megaMenu: {
          groups: [
            { title: 'Miền Bắc', links: [{ label: 'Hà Giang', href: '/diem-den/ha-giang' }] },
            { title: 'Miền Trung', links: [{ label: 'Đà Nẵng', href: '/diem-den/da-nang' }] },
            { title: 'Miền Nam', links: [{ label: 'Phú Quốc', href: '/diem-den/phu-quoc' }] },
          ],
        },
      },
      { label: 'Tour nước ngoài', href: '/danh-muc/tour-nuoc-ngoai' },
      { label: 'Cẩm nang', href: '/cam-nang' },
      { label: 'Giới thiệu', href: '/gioi-thieu' },
    ],
  },
})

await payload.updateGlobal({
  slug: 'footer',
  context,
  data: {
    columns: [
      { title: 'Khám phá', links: [{ label: 'Tour trong nước', href: '/danh-muc/tour-trong-nuoc' }, { label: 'Cẩm nang', href: '/cam-nang' }] },
      { title: 'Về chúng tôi', links: [{ label: 'Giới thiệu', href: '/gioi-thieu' }, { label: 'Liên hệ', href: '/lien-he' }] },
    ],
  },
})

await payload.updateGlobal({
  slug: 'site-settings',
  context,
  data: {
    hotline: '0973122807',
    email: 'lecuongg242@gmail.com',
    zalo: '0973122807',
    bookingPath: '/lien-he',
    companyName: 'Rosa Travel (QA)',
    about: 'Dữ liệu mẫu trong database QA.',
    copyright: '© 2026 Rosa Travel',
  },
})

payload.logger.info(`Đã tạo dữ liệu mẫu trong database "${dbName}".`)
process.exit(0)
