/**
 * Timing cho animation điều khiển bằng JS (gsap, motion). Đơn vị giây.
 *
 * Animation thuần CSS (hover, transition trong Tailwind) lấy từ các biến
 * `--duration-*` / `--ease-*` khai báo trong `src/app/globals.css`. Hai bản này
 * PHẢI khớp nhau; đổi một bên thì đổi cả hai. Tách làm hai vì Tailwind không
 * đọc được file TypeScript.
 */
/**
 * MỘT CỬ CHỈ = MỘT THỜI LƯỢNG.
 *
 * Khi hover một thẻ làm đổi nhiều thứ cùng lúc (bóng đổ, ảnh, màu tiêu đề,
 * nhãn hiện ra), TẤT CẢ phải dùng chung một mốc. Trộn nhiều mốc trong cùng một
 * thao tác không cho ra "nhiều lớp chuyển động" — nó cho ra cảm giác GIẬT CỤC,
 * vì các phần của cùng một cử chỉ về đích ở những thời điểm khác nhau.
 *
 * Đây là lỗi đã xảy ra thật và đã đo được: một thẻ tour từng chạy ba tốc độ
 * cùng lúc — thẻ nghiêng 0.3s, ảnh phóng 0.9s, tiêu đề đổi màu 0.15s. Không có
 * khung hình nào bị rớt (trace đo được 0 khung trễ trên 767 khung), nhưng vẫn
 * trông hỏng. Vấn đề nằm ở thiết kế chuyển động, không ở hiệu năng.
 *
 * `fast` chỉ dành cho thao tác đổi ĐÚNG MỘT thuộc tính và không có gì để đồng
 * bộ cùng: liên kết trên header, nút đóng, viền ô nhập khi focus.
 */
export const duration = {
  fast: 0.15,
  base: 0.3,
  slow: 0.6,
  slower: 0.9,
} as const

/**
 * Chuỗi cubic-bezier dùng cho gsap (CustomEase không cần thiết ở đây).
 * enter: bung nhanh rồi hãm mượt — hợp với reveal khi vào viewport.
 * scrub: đối xứng — hợp với animation buộc vào tiến độ scroll.
 * hover: hãm nhẹ — phản hồi tức thì nhưng không cụt.
 */
export const easing = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  scrub: 'cubic-bezier(0.45, 0, 0.55, 1)',
  hover: 'cubic-bezier(0.33, 1, 0.68, 1)',
} as const

/** Dạng mảng cho motion (framer-motion nhận [x1, y1, x2, y2]). */
export const easingArray = {
  enter: [0.16, 1, 0.3, 1],
  scrub: [0.45, 0, 0.55, 1],
  hover: [0.33, 1, 0.68, 1],
} as const

/** Khoảng cách giữa các phần tử trong một nhóm reveal, đơn vị giây. */
export const stagger = 0.06

/** Quãng dịch chuyển của reveal, đơn vị px. */
export const distance = 24

/** Độ trễ làm mượt khi buộc animation vào tiến độ scroll — tham số `scrub` của ScrollTrigger. */
export const scrubSmoothing = 0.6

/** Thời gian nội suy khi gán currentTime cho video scrub, đơn vị giây. */
export const scrubTweenDuration = 0.2
