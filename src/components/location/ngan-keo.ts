/**
 * TRẠNG THÁI + URL CỦA NGĂN KÉO ĐỊA ĐIỂM.
 *
 * Hai quyết định ở đây đều xuất phát từ lỗi thật, không phải sở thích:
 *
 * 1. DÙNG HISTORY API GỐC, KHÔNG DÙNG router.push.
 *    Bản đầu gọi `router.push(pathname + '?dia-diem=...')`. Đường dẫn không đổi,
 *    chỉ thêm tham số — nhưng với Next đó vẫn là một lần ĐIỀU HƯỚNG PHÍA CLIENT,
 *    nên intercepting route `@modal/(.)chuyen-di/[slug]` khớp và dựng thêm một
 *    bản lớp phủ của chính bài đang đọc. Kết quả trên trang đầy đủ: hai
 *    <article>, ba hộp thoại chồng nhau. Đã đo tận mắt.
 *
 * 2. TỰ PHÁT TÍN HIỆU, KHÔNG DÙNG useSearchParams().
 *    Next có vá `history.pushState` để `useSearchParams()` render lại theo. Vá
 *    đó hoạt động ở lần mở ĐẦU TIÊN rồi thôi: mở ngăn kéo → đóng → mở lại thì
 *    URL đổi đúng nhưng không có gì render. Đã đo: lần hai `location.search` có
 *    tham số mà số hộp thoại vẫn bằng 0.
 *
 *    Không đi tìm hiểu vì sao vá của Next hụt ở lần hai — phụ thuộc vào chi tiết
 *    nội bộ của framework cho một thứ nhỏ thế này là sai ngay từ đầu. Module tự
 *    giữ danh sách người nghe và tự báo tin; nó đúng ở mọi lần, và không còn
 *    ràng buộc Suspense mà useSearchParams kéo theo.
 *
 * CHỈ GỌI TỪ TRÌNH DUYỆT. Mọi hàm dưới đây chạm `window`.
 */

/** Tên tham số trên URL. Đổi ở đây là đổi cho cả LocationCard lẫn LocationDrawer. */
export const THAM_SO_NGAN_KEO = 'dia-diem'

/**
 * Đánh dấu mục lịch sử do CHÍNH ngăn kéo tạo ra.
 *
 * Cần để phân biệt hai tình huống lúc đóng: người đọc vừa bấm mở ngăn kéo (có
 * mục lịch sử để lùi lại), hay họ mở thẳng một link được chia sẻ sẵn kèm tham
 * số (không có mục nào cả — gọi back() sẽ ném họ ra khỏi site).
 */
const DAU_MOC = { nganKeoDiaDiem: true }

type NguoiNghe = (slug: string | null) => void
const nguoiNghe = new Set<NguoiNghe>()

/** Đọc slug đang mở từ URL. Trả null trên server và khi không có tham số. */
export function docSlugTuUrl(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(THAM_SO_NGAN_KEO)
}

function baoTin(): void {
  const slug = docSlugTuUrl()
  for (const nghe of nguoiNghe) nghe(slug)
}

/** Đăng ký nhận tin khi ngăn kéo mở/đóng. Trả về hàm huỷ đăng ký. */
export function theoDoiNganKeo(nghe: NguoiNghe): () => void {
  nguoiNghe.add(nghe)
  return () => {
    nguoiNghe.delete(nghe)
  }
}

function urlVoiThamSo(slug: string): string {
  const con = new URLSearchParams(window.location.search)
  con.set(THAM_SO_NGAN_KEO, slug)
  return `${window.location.pathname}?${con.toString()}`
}

export function moNganKeo(slug: string): void {
  const dangMo = docSlugTuUrl() !== null
  const url = urlVoiThamSo(slug)
  // Đang mở sẵn rồi mà bấm sang địa điểm khác thì THAY THẾ mục lịch sử, không
  // thêm mới. Nếu không, xem lướt năm địa điểm là chất năm mục vào lịch sử và
  // người đọc phải nhấn Back năm lần mới thoát khỏi bài.
  if (dangMo) window.history.replaceState(DAU_MOC, '', url)
  else window.history.pushState(DAU_MOC, '', url)
  baoTin()
}

export function dongNganKeo(): void {
  if (window.history.state?.nganKeoDiaDiem) {
    // Mục lịch sử này do ta tạo ra — lùi lại là cách đóng đúng, và nút Back của
    // trình duyệt cũng cho ra cùng kết quả. Sự kiện `popstate` sẽ lo phần báo
    // tin, nên KHÔNG gọi baoTin() ở nhánh này (gọi thêm sẽ báo hai lần với
    // trạng thái URL chưa kịp cập nhật).
    window.history.back()
    return
  }
  // Người đọc mở thẳng một link có sẵn tham số. Không có gì để lùi, nên chỉ gỡ
  // tham số ra khỏi URL hiện tại — và phải tự báo tin vì replaceState không
  // sinh popstate.
  const con = new URLSearchParams(window.location.search)
  con.delete(THAM_SO_NGAN_KEO)
  const chuoi = con.toString()
  window.history.replaceState(
    null,
    '',
    chuoi ? `${window.location.pathname}?${chuoi}` : window.location.pathname,
  )
  baoTin()
}
