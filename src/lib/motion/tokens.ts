/**
 * Nguồn chân lý duy nhất cho timing của mọi animation trong dự án.
 * Đơn vị giây, dùng chung được cho cả gsap và motion.
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
