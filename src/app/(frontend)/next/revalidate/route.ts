import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

import { tags } from '@/lib/cache-tags'
import { isValidRevalidateAuth } from '@/lib/revalidate-token'

// Tag theo slug (tour:…, destination:…) luôn đi kèm tag của cả collection nên không cần liệt kê.
const ALL_TAGS = [
  tags.tours,
  tags.destinations,
  tags.categories,
  tags.posts,
  tags.pages,
  tags.reviews,
  tags.banners,
  tags.clients,
  tags.global('home'),
  tags.global('header'),
  tags.global('footer'),
  tags.global('site-settings'),
]

/**
 * Làm mới toàn bộ cache dữ liệu. Dùng sau khi sửa dữ liệu bằng script (chạy ngoài Next nên
 * hook trong Payload không làm mới được): `pnpm exec tsx src/scripts/revalidate-site.ts <url>`.
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isValidRevalidateAuth(request.headers.get('authorization'), process.env.PAYLOAD_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  for (const tag of ALL_TAGS) {
    // Hết hạn ngay: lượt truy cập sau lấy dữ liệu mới, không phục vụ bản cũ.
    revalidateTag(tag, { expire: 0 })
  }
  return NextResponse.json({ revalidated: ALL_TAGS })
}
