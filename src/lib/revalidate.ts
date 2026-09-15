import { revalidateTag } from 'next/cache'

/**
 * Đánh dấu dữ liệu cũ để lần truy cập sau lấy bản mới (Next 16 bắt buộc truyền
 * profile; `max` = phục vụ bản cũ trong lúc tải bản mới ở nền).
 */
export function revalidateTags(tags: string[]): void {
  for (const tag of new Set(tags.filter(Boolean))) {
    try {
      revalidateTag(tag, 'max')
    } catch (error) {
      // Gọi ngoài một request của Next (vd. script seed chạy bằng `payload run`)
      // thì Next ném lỗi. Không có trang nào đang cache để làm mới, nên bỏ qua.
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[revalidate] bỏ qua tag "${tag}": ${(error as Error).message}`)
      }
    }
  }
}
