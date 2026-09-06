/**
 * Sinh ảnh AVIF + WebP nhiều kích thước và blur placeholder từ ảnh gốc.
 *
 * Vào:  assets-src/**\/*.{jpg,jpeg,png,webp}
 * Ra:   public/media/<đường dẫn tương đối>-<width>.{avif,webp}
 *
 * Chạy: pnpm media
 *
 * In ra bảng metadata (src, width, height, blurDataURL) để dán vào content JSON.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC_DIR = path.join(process.cwd(), 'assets-src')
const OUT_DIR = path.join(process.cwd(), 'public', 'media')
const WIDTHS = [640, 1024, 1600, 2400]
const INPUT_EXT = /\.(jpe?g|png|webp|tiff?)$/i

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : Promise.resolve([full])
    }),
  )
  return files.flat().filter((f) => INPUT_EXT.test(f))
}

async function processImage(file: string) {
  const relative = path.relative(SRC_DIR, file)
  const relativeNoExt = relative.replace(INPUT_EXT, '')
  const outPath = path.join(OUT_DIR, relativeNoExt)
  await mkdir(path.dirname(outPath), { recursive: true })

  const image = sharp(file)
  const meta = await image.metadata()
  const originalWidth = meta.width ?? WIDTHS[WIDTHS.length - 1]
  const originalHeight = meta.height ?? 0

  // Sinh ĐỦ cả bốn mốc, kể cả khi ảnh gốc nhỏ hơn mốc đó.
  //
  // Lý do: loader là hàm thuần, không biết ảnh nào có sẵn biến thể nào — nó luôn
  // ánh xạ bề rộng yêu cầu vào một trong bốn mốc. Bỏ qua một mốc nghĩa là ảnh vỡ
  // ở đúng breakpoint đó, và lỗi chỉ lộ ra trên màn hình lớn.
  //
  // withoutEnlargement giữ cho ảnh không bị phóng to thật: file ở mốc lớn chỉ
  // chứa đúng kích thước gốc. Tốn thêm chút dung lượng, đổi lấy việc không bao
  // giờ 404.
  for (const width of WIDTHS) {
    const resize = { width, withoutEnlargement: true } as const
    await sharp(file).resize(resize).avif({ quality: 60 }).toFile(`${outPath}-${width}.avif`)
    await sharp(file).resize(resize).webp({ quality: 72 }).toFile(`${outPath}-${width}.webp`)
  }

  const largest = WIDTHS[WIDTHS.length - 1]
  if (originalWidth < largest) {
    console.warn(
      `⚠ ${relative} chỉ rộng ${originalWidth}px, nhỏ hơn mốc lớn nhất ${largest}px.\n` +
        '  Ảnh vẫn hiển thị được nhưng sẽ mờ trên màn hình lớn — nên thay bằng bản độ phân giải cao hơn.',
    )
  }

  // Blur placeholder: ảnh 16px rất nhẹ, nhúng thẳng vào JSON dưới dạng data URL.
  const blur = await sharp(file).resize(16).webp({ quality: 40 }).toBuffer()

  return {
    src: `/media/${relativeNoExt.split(path.sep).join('/')}.avif`,
    alt: { vi: 'TODO: viết alt mô tả nội dung ảnh' },
    width: Math.min(originalWidth, WIDTHS[WIDTHS.length - 1]),
    height: Math.round(
      (Math.min(originalWidth, WIDTHS[WIDTHS.length - 1]) / originalWidth) * originalHeight,
    ),
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
  }
}

async function main() {
  const files = await walk(SRC_DIR)
  if (files.length === 0) {
    console.log('Không tìm thấy ảnh nào trong assets-src/. Bỏ qua.')
    return
  }

  const results = []
  for (const file of files) {
    results.push(await processImage(file))
    console.log(`✓ ${path.relative(SRC_DIR, file)}`)
  }

  const manifestPath = path.join(process.cwd(), 'content', 'media-manifest.json')
  await writeFile(manifestPath, JSON.stringify(results, null, 2), 'utf8')
  console.log(`\nĐã ghi metadata của ${results.length} ảnh vào content/media-manifest.json`)
  console.log('Copy các khối cần dùng sang content/tours/*.json và điền alt tiếng Việt.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
