/**
 * Nạp nội dung JSON hiện có (content/home.json, content/tours/*.json) vào Payload.
 *
 * Giá trị thật của script này KHÔNG phải là di trú dữ liệu — nội dung hiện tại
 * gần như toàn là mẫu (ảnh placeholder, giá/tour giả). Giá trị của nó là kiểm
 * chứng đầu-cuối rằng mô hình Payload (collections `media`, `tours`, global
 * `home` — Task 2-4) nhận đúng hình dạng mà `tourSchema` / `homeContentSchema`
 * (Task 5, src/lib/content/schema.ts) đòi hỏi. Nếu một trường không khớp, đó
 * là một phát hiện cần báo cáo — KHÔNG được nắn dữ liệu JSON cho vừa.
 *
 * public/media/placeholder/ chỉ chứa các biến thể ĐÃ xử lý (hero-640.avif,
 * hero-1024.avif, ...), không có bản gốc. Script tải lên biến thể LỚN NHẤT có
 * sẵn của mỗi ảnh làm file nguồn — Payload tự sinh lại bốn mốc bề rộng + ảnh
 * og + blurDataURL từ đó (xem src/collections/Media.ts).
 *
 * Idempotent: chạy `pnpm seed` nhiều lần không tạo bản ghi trùng — ảnh được
 * nhận diện qua `filename`, tour qua `slug`; global `home` luôn được ghi đè
 * bằng cùng một dữ liệu nên không có khái niệm "trùng" đối với nó.
 *
 * Chạy: pnpm seed
 */
import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// tsx (khác với `next dev`) không tự nạp .env.local — phải nạp tay TRƯỚC khi
// import payload.config.ts, vì file đó đọc process.env ngay lúc module được
// import (hàm required() ở top-level). Import động ở main() bên dưới đảm bảo
// thứ tự này.
try {
  process.loadEnvFile(path.join(ROOT, '.env.local'))
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  console.warn(
    'Không tìm thấy .env.local — nếu MONGODB_URI/PAYLOAD_SECRET/BLOB_READ_WRITE_TOKEN chưa được đặt sẵn trong môi trường, bước tiếp theo sẽ báo lỗi rõ ràng.',
  )
}

const WIDTHS_DESC = [2400, 1600, 1024, 640] as const
const PLACEHOLDER_DIR = path.join(ROOT, 'public', 'media', 'placeholder')
const MIME_BY_EXT: Record<string, string> = {
  avif: 'image/avif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/** Ném lỗi kèm tên bản ghi đang xử lý — dừng ngay, không nuốt lỗi. */
function loi(thongDiep: string): never {
  throw new Error(thongDiep)
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function mimeFor(ext: string): string {
  return MIME_BY_EXT[ext.toLowerCase()] ?? 'application/octet-stream'
}

/** "hero.avif" -> { base: "hero", ext: "avif" } */
function baseNameOf(src: string): { base: string; ext: string } {
  const filename = src.split('/').pop() ?? src
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return { base: filename, ext: '' }
  return { base: filename.slice(0, dot), ext: filename.slice(dot + 1) }
}

function withOrdinalSuffix(filename: string, n: number): string {
  if (n <= 1) return filename
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return `${filename}-${n}`
  return `${filename.slice(0, dot)}-${n}${filename.slice(dot)}`
}

/**
 * Tìm file nguồn để upload cho một ảnh được JSON tham chiếu tới, ví dụ
 * "/media/placeholder/hero.avif". Ưu tiên file đúng y đường dẫn đó nếu có
 * (trường hợp og.jpg — không có hậu tố bề rộng); nếu không, thử lần lượt các
 * mốc bề rộng từ lớn nhất xuống nhỏ nhất (trường hợp hero/gallery-1 — chỉ có
 * biến thể đã xử lý, không có bản gốc).
 */
async function resolveLargestVariantFile(src: string): Promise<string> {
  const exactPath = path.join(ROOT, 'public', ...src.replace(/^\//, '').split('/'))
  if (await fileExists(exactPath)) return exactPath

  const { base, ext } = baseNameOf(src)
  for (const w of WIDTHS_DESC) {
    const candidate = path.join(PLACEHOLDER_DIR, `${base}-${w}.${ext}`)
    if (await fileExists(candidate)) return candidate
  }
  loi(
    `Không tìm thấy file nguồn nào cho ảnh "${src}" — đã thử đường dẫn gốc và các mốc ${WIDTHS_DESC.join(', ')}px trong ${PLACEHOLDER_DIR}`,
  )
}

/** Node dạng ảnh trong JSON nội dung: { src, alt: { vi }, width, height, blurDataURL }. */
function isImageNode(v: unknown): v is { src: string; alt: { vi: string } } {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (typeof o.src !== 'string') return false
  const alt = o.alt as Record<string, unknown> | undefined
  return !!alt && typeof alt === 'object' && typeof alt.vi === 'string'
}

function mediaKey(node: { src: string; alt: { vi: string } }): string {
  return `${node.src}::${node.alt.vi}`
}

/** Duyệt đệ quy toàn bộ JSON, gom mọi node dạng ảnh (giữ thứ tự gặp đầu tiên). */
function collectImageNodes(
  value: unknown,
  out: Map<string, { src: string; altVi: string }>,
): void {
  if (Array.isArray(value)) {
    for (const v of value) collectImageNodes(v, out)
    return
  }
  if (isImageNode(value)) {
    const key = mediaKey(value)
    if (!out.has(key)) out.set(key, { src: value.src, altVi: value.alt.vi })
    return
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectImageNodes(v, out)
  }
}

/**
 * Thay mọi node dạng ảnh trong một JSON bằng id media Payload tương ứng.
 * Hình dạng kết quả khớp thẳng field `relationship` của Payload (một id cho
 * quan hệ đơn, mảng id cho quan hệ hasMany) — không cần biến đổi gì thêm.
 */
function resolveMediaRefs(value: unknown, mediaIndex: Map<string, string>): unknown {
  if (Array.isArray(value)) return value.map((v) => resolveMediaRefs(v, mediaIndex))
  if (isImageNode(value)) {
    const key = mediaKey(value)
    const id = mediaIndex.get(key)
    if (!id) {
      loi(`Không tìm thấy media đã tải lên cho ảnh "${value.src}" (alt: "${value.alt.vi}")`)
    }
    return id
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        resolveMediaRefs(v, mediaIndex),
      ]),
    )
  }
  return value
}

async function readJson(absPath: string): Promise<unknown> {
  return JSON.parse(await readFile(absPath, 'utf8'))
}

async function main() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  try {
    console.log('Đang đọc nội dung JSON từ content/...')
    const homeJson = (await readJson(path.join(ROOT, 'content', 'home.json'))) as Record<
      string,
      unknown
    >
    const tourFiles = (await readdir(path.join(ROOT, 'content', 'tours')))
      .filter((f) => f.endsWith('.json'))
      .sort()
    const tourJsons = await Promise.all(
      tourFiles.map(async (f) => ({
        file: f,
        json: (await readJson(path.join(ROOT, 'content', 'tours', f))) as Record<string, unknown>,
      })),
    )
    console.log(`  Đã đọc content/home.json và ${tourJsons.length} tour: ${tourFiles.join(', ')}`)

    // --- 1. Gom mọi tham chiếu ảnh (home trước, rồi từng tour theo thứ tự tên file) ---
    const imageNodes = new Map<string, { src: string; altVi: string }>()
    collectImageNodes(homeJson, imageNodes)
    for (const { json } of tourJsons) collectImageNodes(json, imageNodes)

    // --- 2. Tải ảnh lên collection `media`, giữ id trong mediaIndex ---
    console.log(`\nĐang xử lý ${imageNodes.size} ảnh khác nhau (theo cặp src+alt)...`)
    const mediaIndex = new Map<string, string>()
    const baseCounts = new Map<string, number>()
    for (const [key, { src, altVi }] of imageNodes) {
      try {
        const sourcePath = await resolveLargestVariantFile(src)
        const { base, ext } = baseNameOf(src)
        const n = (baseCounts.get(base) ?? 0) + 1
        baseCounts.set(base, n)
        const uploadName = withOrdinalSuffix(path.basename(sourcePath), n)

        const existing = await payload.find({
          collection: 'media',
          where: { filename: { equals: uploadName } },
          limit: 1,
        })
        if (existing.docs.length > 0) {
          const doc = existing.docs[0]
          console.log(`  → Ảnh "${uploadName}" đã tồn tại (id ${doc.id}) — bỏ qua tải lên.`)
          mediaIndex.set(key, String(doc.id))
          continue
        }

        const data = await readFile(sourcePath)
        const created = await payload.create({
          collection: 'media',
          data: { alt: { vi: altVi } },
          file: {
            data,
            mimetype: mimeFor(ext),
            name: uploadName,
            size: data.byteLength,
          },
        })
        console.log(`  ✓ Tải lên "${uploadName}" (id ${created.id}, alt: "${altVi}")`)
        mediaIndex.set(key, String(created.id))
      } catch (err) {
        throw new Error(
          `Lỗi khi xử lý ảnh "${src}" (alt: "${altVi}"): ${(err as Error).message}`,
        )
      }
    }

    // --- 3. Tạo tour, trỏ quan hệ ảnh tới id vừa có ---
    console.log(`\nĐang xử lý ${tourJsons.length} tour...`)
    const slugToTourId = new Map<string, string>()
    for (const { file, json: tourJson } of tourJsons) {
      const slug = tourJson.slug as string
      try {
        const existing = await payload.find({
          collection: 'tours',
          where: { slug: { equals: slug } },
          limit: 1,
        })
        if (existing.docs.length > 0) {
          const doc = existing.docs[0]
          console.log(`  → Tour "${slug}" đã tồn tại (id ${doc.id}) — bỏ qua, không tạo trùng.`)
          slugToTourId.set(slug, String(doc.id))
          continue
        }

        // currency: tourSchema ép cứng 'VND', Tours collection không khai
        // trường này (xem comment đầu src/collections/Tours.ts) — bỏ qua.
        // itinerary[].day: Payload suy ra từ vị trí trong mảng, không lưu
        // trùng lặp trường này — bỏ qua từng phần tử.
        const { currency: _currency, itinerary, ...rest } = tourJson
        const tourData = {
          ...(resolveMediaRefs(rest, mediaIndex) as Record<string, unknown>),
          itinerary: ((itinerary as Record<string, unknown>[] | undefined) ?? []).map((day) => {
            const { day: _dayNumber, ...dayRest } = day
            return resolveMediaRefs(dayRest, mediaIndex)
          }),
        }

        const created = await payload.create({
          collection: 'tours',
          data: tourData as never,
        })
        console.log(`  ✓ Tạo tour "${slug}" (id ${created.id})`)
        slugToTourId.set(slug, String(created.id))
      } catch (err) {
        throw new Error(`Lỗi khi xử lý tour "${slug}" (file ${file}): ${(err as Error).message}`)
      }
    }

    // --- 4. Ghi global `home`, trỏ featuredTours + ảnh tới id vừa có ---
    console.log('\nĐang cập nhật global home...')
    try {
      const {
        featuredTourSlugs,
        testimonials,
        ...homeRest
      } = homeJson as {
        featuredTourSlugs: string[]
        testimonials: Array<Record<string, unknown>>
        [k: string]: unknown
      }

      const featuredTours = featuredTourSlugs.map((slug) => {
        const id = slugToTourId.get(slug)
        if (!id) {
          loi(
            `home.json.featuredTourSlugs trỏ tới slug "${slug}" nhưng không có tour nào như vậy (đã có: ${[...slugToTourId.keys()].join(', ') || '(không có)'})`,
          )
        }
        return id
      })

      const homeData = {
        ...(resolveMediaRefs(homeRest, mediaIndex) as Record<string, unknown>),
        featuredTours,
        testimonials: testimonials.map((t) => {
          const { tourSlug, avatar, ...restT } = t as {
            tourSlug?: string
            avatar?: unknown
            [k: string]: unknown
          }
          return {
            ...(resolveMediaRefs(restT, mediaIndex) as Record<string, unknown>),
            ...(tourSlug
              ? {
                  tour:
                    slugToTourId.get(tourSlug) ??
                    loi(`Cảm nhận khách hàng trỏ tới tour slug "${tourSlug}" không tồn tại`),
                }
              : {}),
            ...(avatar ? { avatar: resolveMediaRefs(avatar, mediaIndex) } : {}),
          }
        }),
      }

      await payload.updateGlobal({ slug: 'home', data: homeData as never })
      console.log(
        `  ✓ Cập nhật global home xong (featuredTours: ${featuredTours.join(', ')}).`,
      )
    } catch (err) {
      throw new Error(`Lỗi khi xử lý global home: ${(err as Error).message}`)
    }

    console.log(
      `\nHoàn tất: ${mediaIndex.size} ảnh, ${slugToTourId.size} tour, 1 global home đã sẵn sàng.`,
    )
  } finally {
    // Đóng kết nối MongoDB — nếu không, tiến trình tsx sẽ treo mãi không thoát.
    await payload.destroy()
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n✗ Nạp nội dung thất bại:', err instanceof Error ? err.message : err)
    process.exit(1)
  })
