import type { Location } from '@/lib/content'

/**
 * Gom địa điểm từ các ngày của một bài viết hoặc một lịch trình tour, bỏ trùng
 * theo slug và giữ nguyên thứ tự xuất hiện.
 *
 * Sống trong file RIÊNG, không nằm cùng LocationDrawer, vì file đó có chỉ thị
 * `'use client'`. Mọi thứ export từ một module client đều trở thành tham chiếu
 * client — kể cả một hàm thuần như thế này — và server gọi vào sẽ vỡ lúc
 * prerender với thông báo "Attempted to call gomDiaDiem() from the server but
 * gomDiaDiem is on the client". Đây chính là lỗi đã xảy ra thật.
 *
 * File này không có chỉ thị nào nên dùng được ở cả hai phía.
 *
 * Bỏ trùng là bắt buộc chứ không phải tối ưu: cùng một homestay thường xuất
 * hiện ở hai ba ngày liền trong một chuyến, và ngăn kéo tra địa điểm theo slug
 * — danh sách có bản trùng thì vẫn đúng, nhưng nó phình ra vô ích trong payload
 * gửi xuống trình duyệt ở MỌI trang tour và MỌI bài viết.
 */
export function gomDiaDiem(cacNgay: { locations: Location[] }[]): Location[] {
  const daThay = new Set<string>()
  const ket: Location[] = []
  for (const ngay of cacNgay) {
    for (const diaDiem of ngay.locations) {
      if (daThay.has(diaDiem.slug)) continue
      daThay.add(diaDiem.slug)
      ket.push(diaDiem)
    }
  }
  return ket
}
