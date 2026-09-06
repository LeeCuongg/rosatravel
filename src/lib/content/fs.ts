import type { z } from 'zod'
import { homeContentSchema, tourSchema, type HomeContent, type Tour } from './schema'

/**
 * Import động cho hai module chỉ tồn tại ở Node.js, kèm chú thích `webpackIgnore`
 * để bundler bỏ qua việc resolve/dựng chúng — không phải vì file này được dùng
 * ở trình duyệt, mà vì component 'use client' (HeroCinematic) import một giá trị
 * khác (isVideoAsset) từ cùng barrel '@/lib/content', nên file này bị kéo theo
 * vào bundle trình duyệt dù không hàm nào ở đây thực sự chạy ở đó. Import tĩnh
 * (`import ... from 'node:fs/promises'`) khiến webpack cố dựng module ngay ở
 * bước "make" — trước khi tree-shaking kịp loại bỏ nhánh không dùng tới — và
 * gây lỗi build cứng vì `node:` là một scheme mà webpack không xử lý.
 */
let nodePromise: Promise<{
  readFile: typeof import('node:fs/promises').readFile
  readdir: typeof import('node:fs/promises').readdir
  path: typeof import('node:path')
}> | null = null

function loadNode() {
  if (!nodePromise) {
    nodePromise = Promise.all([
      import(/* webpackIgnore: true */ 'node:fs/promises'),
      import(/* webpackIgnore: true */ 'node:path'),
    ]).then(([fsPromises, pathModule]) => ({
      readFile: fsPromises.readFile,
      readdir: fsPromises.readdir,
      path: pathModule.default,
    }))
  }
  return nodePromise
}

async function contentDirs() {
  const { path } = await loadNode()
  const CONTENT_DIR = path.join(process.cwd(), 'content')
  return { CONTENT_DIR, TOURS_DIR: path.join(CONTENT_DIR, 'tours') }
}

async function readJson(filePath: string): Promise<unknown> {
  const { readFile } = await loadNode()
  return JSON.parse(await readFile(filePath, 'utf8'))
}

/**
 * Validate và ném lỗi kèm tên file. Content sai ở file nào phải nói ra file đó,
 * không thì đi tìm giữa hàng chục tour rất mất thời gian.
 */
function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, source: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Nội dung không hợp lệ tại ${source}:\n${JSON.stringify(result.error, null, 2)}`)
  }
  return result.data
}

export async function readTourSlugs(): Promise<string[]> {
  const { readdir } = await loadNode()
  const { TOURS_DIR } = await contentDirs()
  const files = await readdir(TOURS_DIR)
  return files.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
}

export async function readTour(slug: string): Promise<Tour | null> {
  const { path } = await loadNode()
  const { TOURS_DIR } = await contentDirs()
  const file = path.join(TOURS_DIR, `${slug}.json`)
  try {
    return parseOrThrow<Tour>(tourSchema, await readJson(file), file)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function readTours(): Promise<Tour[]> {
  const slugs = await readTourSlugs()
  const tours = await Promise.all(slugs.map(readTour))
  return tours.filter((t): t is Tour => t !== null)
}

export async function readHomeContent(): Promise<HomeContent> {
  const { CONTENT_DIR } = await contentDirs()
  const { path } = await loadNode()
  const file = path.join(CONTENT_DIR, 'home.json')
  return parseOrThrow<HomeContent>(homeContentSchema, await readJson(file), file)
}
