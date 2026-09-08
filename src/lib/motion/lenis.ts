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
 * ĐẾM số lớp đang yêu cầu khoá cuộn, chứ không phải một cờ bật/tắt.
 *
 * Phải đếm vì các lớp phủ LỒNG NHAU: mở một bài "Chuyến đã đi" là khoá lần
 * một, mở tiếp ngăn kéo địa điểm bên trong bài đó là khoá lần hai. Với một cờ
 * boolean, đóng ngăn kéo sẽ mở khoá cuộn trong khi bài vẫn đang mở — nền lại
 * trôi tự do dưới lớp phủ, đúng cái lỗi mà cơ chế này sinh ra để chặn.
 *
 * Cũng phải nhớ trạng thái chứ không chỉ gọi `stop()` một lần: SmoothScroll nạp
 * Lenis bằng import động, nên có khoảnh khắc lớp phủ đã mở mà Lenis chưa đăng
 * ký. Không có bộ đếm thì lệnh khoá rơi vào khoảng không, và vài trăm mili giây
 * sau Lenis khởi động ở trạng thái đang chạy.
 */
let soLopDangKhoa = 0

/** SmoothScroll gọi khi tạo xong instance, và gọi lại với `null` khi dọn dẹp. */
export function dangKyLenis(instance: LenisLike | null): void {
  hienTai = instance
  if (instance && soLopDangKhoa > 0) instance.stop()
}

export function khoaCuonTrang(): void {
  soLopDangKhoa += 1
  hienTai?.stop()
}

export function moKhoaCuonTrang(): void {
  // Kẹp sàn về 0: một lần mở khoá thừa (vd. effect bị gọi cleanup hai lần trong
  // Strict Mode) không được đẩy bộ đếm xuống âm, vì khi đó lần khoá kế tiếp sẽ
  // không có tác dụng và lỗi hiện ra ở một thao tác hoàn toàn khác.
  soLopDangKhoa = Math.max(0, soLopDangKhoa - 1)
  if (soLopDangKhoa === 0) hienTai?.start()
}
