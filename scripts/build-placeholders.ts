/**
 * Sinh ảnh placeholder tối thiểu để dự án chạy được trước khi có ảnh thật.
 *
 * content/home.json và content/tours/mau-ha-giang.json tham chiếu tới
 * /media/placeholder/{hero,gallery-1,og}.avif — nhưng public/media bị
 * gitignore (xem .gitignore), nên clone repo xong phải chạy lại script này.
 *
 * Chạy: pnpm placeholders
 */
import sharp from 'sharp'

const WIDTHS = [640, 1024, 1600, 2400]

async function make(name: string, w: number, h: number) {
  const base = sharp({
    create: { width: w, height: h, channels: 3, background: { r: 20, g: 26, b: 33 } },
  })
  // Sinh ĐỦ cả bốn mốc, kể cả khi ảnh gốc nhỏ hơn mốc đó — xem lý do trong
  // scripts/build-media.ts. withoutEnlargement giữ cho ảnh không bị phóng to thật.
  for (const width of WIDTHS) {
    await base
      .clone()
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 60 })
      .toFile(`public/media/placeholder/${name}-${width}.avif`)
  }
}

// Ảnh og: riêng, KHÔNG có hậu tố -{width} — cố ý, vì URL trong metadata
// (og:image, sitemap, ...) không bao giờ đi qua src/lib/media/loader.ts, loader
// đó chỉ chạy bên trong next/image. Xuất ra JPEG chứ không phải AVIF vì các
// crawler xem trước link (Facebook, Zalo, Twitter) không giải mã được AVIF.
async function makeOg() {
  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: { r: 20, g: 26, b: 33 } },
  })
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 82 })
    .toFile('public/media/placeholder/og.jpg')
}

async function main() {
  await make('hero', 2400, 1350)
  await make('gallery-1', 1600, 1067)
  await make('og', 1200, 630)
  await makeOg()
  console.log('done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
