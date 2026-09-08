/**
 * Kiểm kê nội dung đang có trong CMS. CHỈ ĐỌC, không ghi gì.
 *
 * Chạy: npx payload run scripts/kiem-ke.ts
 *
 * `payload run` là thứ nạp .env và biên dịch TypeScript giúp — chạy thẳng bằng
 * `node` sẽ vỡ ở dòng import đầu tiên.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const media = await payload.find({ collection: 'media', depth: 0, limit: 500 })
console.log(`\nẢNH (${media.totalDocs})`)
for (const m of media.docs) {
  console.log(`  ${m.id}  ${String(m.filename).padEnd(38)} ${m.width}x${m.height}  ${(m.alt as { vi?: string })?.vi ?? ''}`)
}

const tours = await payload.find({ collection: 'tours', depth: 0, limit: 500 })
console.log(`\nTOUR (${tours.totalDocs})`)
for (const t of tours.docs) {
  console.log(`  ${t.id}  ${String(t.slug).padEnd(28)} ${t.durationDays} ngày  ${t.priceFrom}`)
}

// findGlobal trả về kiểu `Home` sinh tự động, không có index signature — ép
// thẳng sang Record<string, unknown> bị TypeScript từ chối, phải qua `unknown`.
const h = (await payload.findGlobal({ slug: 'home', depth: 0 })) as unknown as Record<
  string,
  unknown
>
console.log('\nTRANG CHỦ')
console.log('  whyUs:', (h.whyUs as unknown[] | undefined)?.length ?? 0)
console.log('  journey.stops:', ((h.journey as Record<string, unknown>)?.stops as unknown[] | undefined)?.length ?? 0)
console.log('  testimonials:', (h.testimonials as unknown[] | undefined)?.length ?? 0)
console.log('  featuredTours:', (h.featuredTours as unknown[] | undefined)?.length ?? 0)
console.log('  faq:', (h.faq as unknown[] | undefined)?.length ?? 0)
console.log('  guide:', JSON.stringify(h.guide ?? null))

process.exit(0)
