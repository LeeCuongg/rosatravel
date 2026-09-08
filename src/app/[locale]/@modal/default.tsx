/**
 * Trạng thái MẶC ĐỊNH của khe `@modal`: không có gì.
 *
 * Next render file này cho khe song song ở mọi đường dẫn không khớp một route
 * nào bên trong `@modal` — tức là ở hầu hết mọi lúc. Thiếu file này, Next
 * không biết vẽ gì vào khe đó khi tải lại trang và trả về 404 cho những đường
 * dẫn hoàn toàn bình thường.
 */
export default function ModalDefault() {
  return null
}
