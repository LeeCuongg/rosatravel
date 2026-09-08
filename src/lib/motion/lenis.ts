/**
 * TAY CẦM TỚI LENIS, để chỗ khác khoá/mở cuộn trang.
 *
 * Vì sao cần: Lenis điều khiển cuộn bằng JavaScript chứ không để trình duyệt tự
 * lo, nên `overflow: hidden` trên <html> KHÔNG chặn được nó. Lớp phủ đặt
 * overflow hidden rồi mà nền vẫn trôi — lỗi này đã xảy ra thật, không phải giả
 * thuyết.
 *
 * Gỡ class `lenis` khỏi <html> cũng không ăn thua: nó bị gắn lại khi cây React
 * render lại lúc điều hướng, và lúc đó lớp phủ đã chạy xong effect của mình.
 *
 * Cách đúng là gọi chính `lenis.stop()` / `lenis.start()`. Nhưng instance Lenis
 * là biến cục bộ trong effect của SmoothScroll, không ai ngoài đó với tới được.
 * Module này là chỗ gửi tay cầm đó ra ngoài.
 *
 * Dùng biến cấp module chứ không phải React context có chủ đích: chỉ có DUY
 * NHẤT một instance Lenis cho cả ứng dụng (SmoothScroll bọc toàn bộ layout), và
 * một context chỉ để chuyền một singleton xuống là thêm provider, thêm re-render,
 * mà không giải quyết thêm gì.
 */

interface LenisLike {
  stop: () => void
  start: () => void
}

let hienTai: LenisLike | null = null

/**
 * Có ai đang yêu cầu khoá cuộn không.
 *
 * Phải nhớ riêng chứ không chỉ gọi `stop()` một lần: SmoothScroll nạp Lenis
 * bằng import động, nên có khoảnh khắc lớp phủ đã mở mà Lenis chưa đăng ký.
 * Không có cờ này thì lệnh khoá rơi vào khoảng không, và vài trăm mili giây sau
 * Lenis khởi động ở trạng thái đang chạy — nền trôi tự do dưới lớp phủ.
 */
let dangKhoa = false

/** SmoothScroll gọi khi tạo xong instance, và gọi lại với `null` khi dọn dẹp. */
export function dangKyLenis(instance: LenisLike | null): void {
  hienTai = instance
  if (instance && dangKhoa) instance.stop()
}

export function khoaCuonTrang(): void {
  dangKhoa = true
  hienTai?.stop()
}

export function moKhoaCuonTrang(): void {
  dangKhoa = false
  hienTai?.start()
}
