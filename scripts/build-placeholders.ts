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
  for (const width of WIDTHS) {
    if (width > w) continue
    await base
      .clone()
      .resize(width)
      .avif({ quality: 60 })
      .toFile(`public/media/placeholder/${name}-${width}.avif`)
  }
}

async function main() {
  await make('hero', 2400, 1350)
  await make('gallery-1', 1600, 1067)
  await make('og', 1200, 630)
  console.log('done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
