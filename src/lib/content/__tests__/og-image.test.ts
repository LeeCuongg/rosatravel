import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getTours } from '../index'

// Bug đã xảy ra thật: mau-ha-giang.json trỏ seo.ogImage.src vào
// /media/placeholder/og.avif — file không tồn tại, vì build-placeholders.ts chỉ
// sinh og-{640,1024,1600,2400}.avif (hậu tố -{width} do src/lib/media/loader.ts
// thêm vào, nhưng loader đó KHÔNG chạy cho URL metadata). Lỗi này trải trên ba
// file khác nhau (content JSON, script sinh ảnh, loader) nên không có test nào
// bắt được cho tới khi nó lên production. Test này khoá hợp đồng đó lại.
describe('seo.ogImage của mọi tour', () => {
  it('không mang hậu tố -{width} do next/image loader thêm vào', async () => {
    const tours = await getTours()
    for (const tour of tours) {
      expect(tour.seo.ogImage.src).not.toMatch(/-(640|1024|1600|2400)\./)
    }
  })

  it('trỏ tới file thật sự tồn tại trong public/', async () => {
    const tours = await getTours()
    for (const tour of tours) {
      const filePath = path.join(process.cwd(), 'public', tour.seo.ogImage.src)
      expect(existsSync(filePath), `Không tìm thấy file: ${filePath}`).toBe(true)
    }
  })
})
