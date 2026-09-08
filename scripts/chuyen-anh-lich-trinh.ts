/**
 * CHUYỂN DỮ LIỆU: itinerary[].media (một ảnh) → itinerary[].images (mảng ảnh).
 *
 * Chạy: npx payload run scripts/chuyen-anh-lich-trinh.ts
 *
 * Chạy MỘT LẦN, sau khi đã cập nhật src/collections/Tours.ts. Không chạy thì
 * mọi ngày trong lịch trình của các tour đã nhập trước GĐ3 sẽ mất ảnh — dữ liệu
 * vẫn nằm trong MongoDB dưới khoá `media`, nhưng Payload không còn khai khoá đó
 * nên không đọc ra và không hiển thị ở đâu cả.
 *
 * Ghi thẳng qua driver MongoDB, KHÔNG qua Local API của Payload. Bắt buộc phải
 * thế: Local API chỉ nhìn thấy những trường có trong config, mà `media` thì vừa
 * bị gỡ khỏi config — gọi payload.find() ở đây sẽ trả về các ngày không có
 * `media` và script tưởng rằng không có gì để chuyển.
 *
 * An toàn khi chạy lại: chỉ đụng tới những ngày CÓ `media` và CHƯA có `images`.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

// Driver thô nằm dưới adapter mongoose. Kiểu của nó không được Payload khai ra
// nên phải ép — đây là chỗ duy nhất trong repo đi vòng qua Local API.
const db = (payload.db as unknown as { connection: { collection: (ten: string) => Collection } })
  .connection

interface Collection {
  find: (loc: unknown) => { toArray: () => Promise<Record<string, unknown>[]> }
  updateOne: (loc: unknown, capNhat: unknown) => Promise<unknown>
}

const tours = db.collection('tours')
const docs = await tours.find({}).toArray()

let soTour = 0
let soNgay = 0

for (const doc of docs) {
  const itinerary = doc.itinerary
  if (!Array.isArray(itinerary)) continue

  let doiGiDo = false
  const moi = itinerary.map((ngay) => {
    const d = ngay as Record<string, unknown>
    // Đã có images rồi thì bỏ qua — script này chạy lại được nhiều lần.
    if (Array.isArray(d.images) && d.images.length > 0) return d
    if (!d.media) return d
    doiGiDo = true
    soNgay += 1
    const { media, ...conLai } = d
    return { ...conLai, images: [media] }
  })

  if (!doiGiDo) continue
  await tours.updateOne({ _id: doc._id }, { $set: { itinerary: moi } })
  soTour += 1
  console.log(`  ${String(doc.slug)}: chuyển ${itinerary.length} ngày`)
}

console.log(`\nXong. ${soNgay} ngày trong ${soTour} tour đã chuyển sang trường "images".`)
if (soTour === 0) {
  console.log('Không có gì để chuyển — hoặc đã chạy rồi, hoặc chưa tour nào gắn ảnh cho ngày.')
}

process.exit(0)
