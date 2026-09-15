/**
 * Lưu lại mọi tour để tính lại các trường tự động (searchText, departureMonths),
 * dùng sau khi thêm trường mới hoặc đổi cách tính.
 *
 *   pnpm payload run src/scripts/reindex-tours.ts
 *
 * Nên chạy khi không có ai đang sửa dở bản nháp của tour đã xuất bản: lưu lại bản
 * đã xuất bản sẽ tạo phiên bản mới mới hơn bản nháp đang sửa.
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const payload = await getPayload({ config })
const context = { disableRevalidate: true }

const { docs } = await payload.find({ collection: 'tours', draft: true, depth: 0, limit: 1000, pagination: false })

for (const tour of docs) {
  await payload.update({
    collection: 'tours',
    id: tour.id,
    data: {},
    draft: tour._status !== 'published',
    context,
  })
}

payload.logger.info(`Đã tính lại trường tự động cho ${docs.length} tour.`)
process.exit(0)
