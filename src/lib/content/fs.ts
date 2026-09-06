import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { z } from 'zod'
import { homeContentSchema, tourSchema, type HomeContent, type Tour } from './schema'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const TOURS_DIR = path.join(CONTENT_DIR, 'tours')

async function readJson(filePath: string): Promise<unknown> {
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
  const files = await readdir(TOURS_DIR)
  return files.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
}

export async function readTour(slug: string): Promise<Tour | null> {
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
  const file = path.join(CONTENT_DIR, 'home.json')
  return parseOrThrow<HomeContent>(homeContentSchema, await readJson(file), file)
}
