/**
 * Nhập tour từ file JSON (soạn từ tài liệu chương trình tour) vào admin.
 *
 *   pnpm payload run src/scripts/import-tours.ts
 *
 * Biến môi trường:
 *   IMPORT_FILE     Đường dẫn file JSON (mặc định docs/tours/import/tours.json).
 *                   Đường dẫn ảnh trong file JSON tính từ thư mục chứa file JSON.
 *   IMPORT_PUBLISH  "true" để xuất bản luôn — CHỈ được phép với database QA.
 *
 * Nguyên tắc:
 * - Mặc định tạo BẢN NHÁP: nhân viên xem lại rồi mới bấm Xuất bản.
 * - Ảnh đầu tiên của tour là ảnh bìa, các ảnh sau vào bộ ảnh. PNG nặng được đổi sang JPEG.
 * - Tour trùng slug thì bỏ qua (kể cả ảnh), nên chạy lại không tạo trùng.
 * - Muốn ảnh lưu local thay vì Vercel Blob (DB QA): đặt DISABLE_BLOB_STORAGE=true.
 */
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'
import sharp from 'sharp'

import type { Destination, RichTextBlock, Tour, TourCategory } from '../payload-types'
import config from '../payload.config'

type Meal = 'breakfast' | 'lunch' | 'dinner'

type ImportFile = {
  destinations: { slug: string; name: string; region: Destination['region'] }[]
  categories: { slug: string; name: string; kind: TourCategory['kind'] }[]
  tours: {
    sourceFile: string
    title: string
    slug: string
    summary: string
    durationDays: number
    durationNights: number
    departureFrom: string
    destinationSlugs: string[]
    categorySlugs: string[]
    price: number
    images?: string[]
    departures: { date: string; price?: number; seatsLeft?: number; note?: string }[]
    highlights: string[]
    itinerary: { title: string; meals: Meal[]; paragraphs: string[] }[]
    priceTable?: { rows: { label: string; price?: number; note?: string }[]; footnote?: string[] }
    included: string[]
    excluded: string[]
    policies: { title: string; paragraphs: string[] }[]
    notes: { title: string; paragraphs: string[] }[]
  }[]
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const file = path.resolve(root, process.env.IMPORT_FILE || 'docs/tours/import/tours.json')
const fileDir = path.dirname(file)
const publish = process.env.IMPORT_PUBLISH === 'true'

const dbName = (() => {
  try {
    return new URL(process.env.MONGODB_URI ?? '').pathname.replace(/^\//, '')
  } catch {
    return ''
  }
})()

if (publish && !/qa/i.test(dbName)) {
  console.error(`Từ chối xuất bản: database "${dbName}" không phải database QA. Bỏ IMPORT_PUBLISH để nhập bản nháp.`)
  process.exit(1)
}

function richText(paragraphs: string[]): RichTextBlock['content'] {
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

/** Ngày "chỉ ngày" trong Payload lưu lúc 12:00 UTC. */
const toDate = (day: string) => `${day}T12:00:00.000Z`

const data = JSON.parse(readFileSync(file, 'utf8')) as ImportFile

// Ảnh có thể khai báo riêng trong images.json cạnh file nội dung (slug → danh sách ảnh).
try {
  const imageMap = JSON.parse(readFileSync(path.join(fileDir, 'images.json'), 'utf8')) as Record<string, string[]>
  for (const tour of data.tours) {
    tour.images ??= imageMap[tour.slug]
  }
} catch {
  // Không có images.json: dùng trường images trong file nội dung (nếu có).
}
const payload = await getPayload({ config })
// Script chạy ngoài Next nên không có cache trang nào để làm mới.
// Mỗi lệnh phải nhận một bản sao `{ ...context }`: plugin Vercel Blob ghi trạng thái file vào
// req.context, dùng chung một object thì từ ảnh thứ hai trở đi file không lên Blob.
const context = { disableRevalidate: true }

const PNG_TO_JPEG_OVER_BYTES = 500 * 1024

/** Tải một ảnh lên thư viện; PNG nặng (thường là ảnh chụp lưu nhầm dạng PNG) đổi sang JPEG. */
async function uploadImage(relativePath: string, alt: string): Promise<string> {
  const absolute = path.resolve(fileDir, relativePath)
  const ext = path.extname(absolute).toLowerCase()
  const baseName = `${path.basename(path.dirname(absolute))}-${path.basename(absolute, ext)}`

  if (ext === '.png' && statSync(absolute).size > PNG_TO_JPEG_OVER_BYTES) {
    const jpeg = await sharp(absolute).flatten({ background: '#ffffff' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
    const media = await payload.create({
      collection: 'media',
      context: { ...context },
      data: { alt },
      file: { data: jpeg, mimetype: 'image/jpeg', name: `${baseName}.jpg`, size: jpeg.length },
    })
    return media.id
  }

  const media = await payload.create({ collection: 'media', context: { ...context }, data: { alt }, filePath: absolute })
  return media.id
}

const destinationIds = new Map<string, string>()
for (const destination of data.destinations) {
  const { docs } = await payload.find({
    collection: 'destinations',
    where: { slug: { equals: destination.slug } },
    draft: true,
    limit: 1,
    depth: 0,
  })
  if (docs[0]) {
    destinationIds.set(destination.slug, docs[0].id)
    continue
  }
  // Ảnh đại diện điểm đến: lấy ảnh bìa của tour đầu tiên thuộc điểm đến này (nếu có).
  const firstTour = data.tours.find((tour) => tour.destinationSlugs.includes(destination.slug) && tour.images?.length)
  const coverImage = firstTour?.images?.[0] ? await uploadImage(firstTour.images[0], destination.name) : undefined

  const created = await payload.create({
    collection: 'destinations',
    draft: !publish,
    context: { ...context },
    data: {
      ...destination,
      _status: publish ? 'published' : 'draft',
      ...(coverImage ? { coverImage } : {}),
    } as Destination,
  })
  destinationIds.set(destination.slug, created.id)
  payload.logger.info(`+ điểm đến: ${destination.name}`)
}

const categoryIds = new Map<string, string>()
for (const category of data.categories) {
  const { docs } = await payload.find({
    collection: 'tour-categories',
    where: { slug: { equals: category.slug } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) {
    categoryIds.set(category.slug, docs[0].id)
    continue
  }
  const created = await payload.create({ collection: 'tour-categories', context: { ...context }, data: { ...category, order: 10 } })
  categoryIds.set(category.slug, created.id)
  payload.logger.info(`+ danh mục: ${category.name}`)
}

let createdCount = 0
for (const tour of data.tours) {
  const existing = await payload.find({
    collection: 'tours',
    where: { slug: { equals: tour.slug } },
    draft: true,
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    payload.logger.info(`= bỏ qua (đã có): ${tour.title}`)
    continue
  }

  const imageIds: string[] = []
  for (const [index, image] of (tour.images ?? []).entries()) {
    imageIds.push(await uploadImage(image, `${tour.title} – ảnh ${index + 1}`))
  }
  const [coverImage, ...gallery] = imageIds
  if (publish && !coverImage) {
    payload.logger.warn(`! bỏ qua xuất bản (thiếu ảnh bìa): ${tour.title}`)
  }

  const layout: NonNullable<Tour['layout']> = []
  if (tour.highlights.length) {
    layout.push({ blockType: 'highlights', items: tour.highlights.map((text) => ({ text })) })
  }
  layout.push({
    blockType: 'itinerary',
    days: tour.itinerary.map((day) => ({ title: day.title, meals: day.meals, content: richText(day.paragraphs) })),
  })
  if (tour.priceTable?.rows.length) {
    layout.push({
      blockType: 'priceTable',
      rows: tour.priceTable.rows,
      ...(tour.priceTable.footnote?.length ? { footnote: richText(tour.priceTable.footnote) } : {}),
    })
  }
  if (tour.included.length || tour.excluded.length) {
    layout.push({
      blockType: 'inclusions',
      included: tour.included.map((text) => ({ text })),
      excluded: tour.excluded.map((text) => ({ text })),
    })
  }
  for (const policy of tour.policies) {
    layout.push({ blockType: 'policy', title: policy.title, content: richText(policy.paragraphs) })
  }
  for (const note of tour.notes) {
    layout.push({ blockType: 'notes', title: note.title, content: richText(note.paragraphs) })
  }

  const shouldPublish = publish && Boolean(coverImage)
  await payload.create({
    collection: 'tours',
    draft: !shouldPublish,
    context: { ...context },
    data: {
      _status: shouldPublish ? 'published' : 'draft',
      title: tour.title,
      slug: tour.slug,
      summary: tour.summary,
      durationDays: tour.durationDays,
      durationNights: tour.durationNights,
      departureFrom: tour.departureFrom,
      destinations: tour.destinationSlugs.map((slug) => destinationIds.get(slug)).filter((id): id is string => Boolean(id)),
      categories: tour.categorySlugs.map((slug) => categoryIds.get(slug)).filter((id): id is string => Boolean(id)),
      price: tour.price,
      departures: tour.departures.map((departure) => ({
        date: toDate(departure.date),
        price: departure.price,
        seatsLeft: departure.seatsLeft,
        note: departure.note,
        status: 'available' as const,
      })),
      layout,
      ...(coverImage ? { coverImage } : {}),
      ...(gallery.length ? { gallery } : {}),
    } as Tour,
  })
  createdCount++
  payload.logger.info(
    `+ tour ${shouldPublish ? '(đã xuất bản)' : '(bản nháp)'}: ${tour.title} — ${imageIds.length} ảnh`,
  )
}

payload.logger.info(`Xong: tạo ${createdCount}/${data.tours.length} tour trong database "${dbName}".`)
process.exit(0)
