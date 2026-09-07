import { revalidatePath } from 'next/cache'

/**
 * Dùng chung cho hook `afterChange`/`afterDelete` của Payload (Tours, Home —
 * Task 8, "đăng là thấy ngay"). Đặt ở một chỗ duy nhất vì logic bắt lỗi bên
 * dưới không phải chuyện vặt: bắt sai phạm vi là bug nghiêm trọng, nhân đôi
 * nó ở hai file hook (Tours.ts, Home.ts) sẽ chỉ khiến ai đó sửa một chỗ mà
 * quên chỗ kia.
 *
 * revalidatePath() chỉ chạy được bên trong một request THẬT của Next.js
 * (Route Handler hoặc Server Action) — nó đọc AsyncLocalStorage nội bộ của
 * Next (workAsyncStorage). Khi admin lưu qua UI, request đi qua route handler
 * REST của Payload (src/app/(payload)/api/[...slug]/route.ts) nên store luôn
 * có sẵn — hoạt động bình thường. Khi Payload Local API được gọi từ một
 * script độc lập chạy bằng tsx, ngoài tiến trình Next (vd. một script seed
 * hoặc di trú dữ liệu chạy tay), không có request nào đang chạy, và
 * revalidatePath ném ĐÚNG MỘT lỗi:
 *
 *   Invariant: static generation store missing in revalidatePath <path>
 *
 * (xem node_modules/next/dist/server/web/spec-extension/revalidate.js, hàm
 * revalidate() — throw khi workAsyncStorage.getStore() rỗng). Đây là trường
 * hợp DUY NHẤT được phép nuốt: nó chỉ có nghĩa "không có request nào đang
 * phục vụ trang tĩnh để làm mới", không phải một lỗi thật.
 *
 * Mọi lỗi KHÁC phải nổi lên và làm hỏng thao tác lưu/xoá. Nuốt một lỗi
 * revalidate thật (bug của Next, thay đổi hành vi trong bản nâng cấp sau
 * này...) sẽ khiến admin thấy lưu "thành công" trong khi site vẫn âm thầm
 * phục vụ nội dung cũ — đúng thất bại mà cả cơ chế revalidation này được
 * viết ra để ngăn, tái xuất hiện ngay trong chính bộ xử lý lỗi của nó.
 */
const LOI_NGOAI_REQUEST_NEXT = 'static generation store missing'

export function revalidatePathAnToan(duongDan: string): void {
  try {
    revalidatePath(duongDan)
  } catch (error) {
    const laLoiNgoaiRequest = error instanceof Error && error.message.includes(LOI_NGOAI_REQUEST_NEXT)
    if (!laLoiNgoaiRequest) throw error
    console.warn(
      `[revalidate] Bỏ qua làm mới "${duongDan}": đang chạy ngoài request Next.js (bình thường khi Payload Local API được gọi từ một script độc lập chạy bằng tsx).`,
    )
  }
}
