import type { FieldHook, TextField } from 'payload'

import { toSearchText } from '../lib/search'

type TourSearchSource = {
  title?: string | null
  summary?: string | null
  departureFrom?: string | null
  destinations?: (string | { id: string } | null)[] | null
}

/**
 * Ghép tên tour, mô tả ngắn, điểm khởi hành và tên điểm đến thành một chuỗi đã bỏ dấu,
 * để khách gõ "quang chau" vẫn tìm ra "Quảng Châu".
 */
const buildSearchText: FieldHook = async ({ siblingData, req }) => {
  const data = siblingData as TourSearchSource
  const destinationIds = (data.destinations ?? [])
    .map((destination) => (typeof destination === 'string' ? destination : destination?.id))
    .filter((id): id is string => Boolean(id))

  let destinationNames: string[] = []
  if (destinationIds.length) {
    const { docs } = await req.payload.find({
      collection: 'destinations',
      where: { id: { in: destinationIds } },
      depth: 0,
      limit: destinationIds.length,
      pagination: false,
      draft: true,
      req,
    })
    destinationNames = docs.map((destination) => destination.name)
  }

  return toSearchText([data.title, data.summary, data.departureFrom, ...destinationNames])
}

// Chưa localized vì site mới có tiếng Việt; khi thêm ngôn ngữ thì bật localized để mỗi ngôn ngữ có chuỗi riêng.
export const searchTextField: TextField = {
  name: 'searchText',
  type: 'text',
  index: true,
  admin: { hidden: true },
  hooks: { beforeChange: [buildSearchText] },
}
