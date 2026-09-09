/**
 * Chọn cấu hình email cho form liên hệ, từ hai nguồn.
 *
 * THỨ TỰ ƯU TIÊN: /admin trước, biến môi trường sau.
 *
 * Ngược với trực giác "biến môi trường luôn thắng", và có lý do: người vận
 * hành sửa được /admin, không sửa được biến môi trường. Nếu env thắng thì họ
 * đổi giá trị trong admin, thấy không có tác dụng gì, và không có cách nào tự
 * biết vì sao — đó là kiểu lỗi tốn nửa ngày để tìm ra.
 *
 * Trộn từng trường một chứ không phải chọn nguyên cụm: điền một trường trong
 * admin và để hai trường kia lấy từ env là trường hợp bình thường (ví dụ đổi
 * hộp thư nhận mà giữ nguyên khoá API do lập trình viên đặt).
 *
 * Hàm thuần, không đọc `process.env` bên trong — nhận cả hai nguồn qua tham số
 * để test được mà không phải chọc vào môi trường của tiến trình.
 */

export interface CauHinhEmail {
  apiKey: string
  emailTo: string
  emailFrom: string
}

/** Trường bị thiếu, dùng để báo lỗi nêu đích danh chứ không nói chung chung. */
export type TruongThieu = keyof CauHinhEmail

function chuoiSach(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function chonCauHinhEmail(
  tuAdmin: Partial<Record<TruongThieu, unknown>> | null | undefined,
  tuMoiTruong: Partial<Record<TruongThieu, string | undefined>>,
):
  | { ok: true; data: CauHinhEmail }
  | { ok: false; thieu: TruongThieu[] } {
  const lay = (khoa: TruongThieu): string =>
    chuoiSach(tuAdmin?.[khoa]) || chuoiSach(tuMoiTruong[khoa])

  const data: CauHinhEmail = {
    apiKey: lay('apiKey'),
    emailTo: lay('emailTo'),
    emailFrom: lay('emailFrom'),
  }

  const thieu = (Object.keys(data) as TruongThieu[]).filter((k) => !data[k])
  return thieu.length > 0 ? { ok: false, thieu } : { ok: true, data }
}

/** Tên hiển thị cho người vận hành đọc, không phải tên biến của lập trình viên. */
export const NHAN_TRUONG: Record<TruongThieu, string> = {
  apiKey: 'Khoá API Resend',
  emailTo: 'Email nhận yêu cầu',
  emailFrom: 'Email gửi đi',
}
