/**
 * Custom loader cho next/image — bắt buộc phải tồn tại vì next.config.ts
 * khai báo `images.loaderFile` trỏ tới đây (xem next.config.ts).
 *
 * Ảnh sẽ được sinh sẵn nhiều kích thước lúc build bằng sharp
 * (xem scripts/build-media.ts, thêm ở task pipeline media). Loader này
 * chỉ trả lại src gốc — không gọi dịch vụ tối ưu ảnh của Vercel.
 */
export default function mediaLoader({ src }: { src: string; width: number; quality?: number }) {
  return src
}
