import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'

type CacheOptions = {
  key: string[]
  /** Tag trong `src/lib/cache-tags.ts`; hook Payload gọi revalidateTag khi xuất bản. */
  tags: string[]
  /** Giây. Mặc định cache tới khi tag được làm mới. */
  revalidate?: number
}

/**
 * Dự án không bật Cache Components của Next 16 (đổi cách render toàn app, kể cả
 * admin Payload), nên dùng `unstable_cache` + tag — mô hình cache "trước" vẫn
 * được Next 16 hỗ trợ. Khi nhân viên đang xem bản nháp từ admin thì bỏ qua cache.
 */
export async function cached<T>({ key, tags, revalidate }: CacheOptions, load: (draft: boolean) => Promise<T>): Promise<T> {
  const { isEnabled: draft } = await draftMode()
  if (draft) {
    return load(true)
  }
  return unstable_cache(() => load(false), ['rosa', ...key], { tags, revalidate: revalidate ?? false })()
}
