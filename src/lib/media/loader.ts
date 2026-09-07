export const MEDIA_WIDTHS = [640, 1024, 1600, 2400] as const

/**
 * Vercel Blob luôn phục vụ file công khai ở dạng
 * `https://<store-id>.public.blob.vercel-storage.com/<tên-file>`. Phần
 * `<store-id>` đổi theo store/môi trường, nhưng hậu tố domain thì cố định và
 * có tài liệu — dùng nó để nhận diện "đây là ảnh do Payload/Blob của chính
 * site này phục vụ" mà không cần biết trước store-id.
 */
const BLOB_HOSTNAME_SUFFIX = '.public.blob.vercel-storage.com'

function laBlobUrl(src: string): boolean {
  try {
    return new URL(src).hostname.endsWith(BLOB_HOSTNAME_SUFFIX)
  } catch {
    // src không phải URL tuyệt đối hợp lệ (vd. đường dẫn tương đối) — không
    // phải ảnh Blob, đi thẳng.
    return false
  }
}

interface LoaderArgs {
  src: string
  width: number
  quality?: number
}

/**
 * Custom loader cho next/image.
 *
 * Collection Media (Task 2, xem src/collections/Media.ts) sinh sẵn 4 biến thể
 * AVIF lúc upload lên Vercel Blob, theo quy ước quan sát được từ URL thật:
 * `<basename>.<ext gốc>` (bản gốc, mọi phần mở rộng) suy ra
 * `<basename>-<width>.avif` cho từng mốc MEDIA_WIDTHS. `map.ts` (src/lib/content)
 * luôn trả về URL GỐC (chưa có hậu tố mốc) trong ImageAsset.src — loader chỉ
 * việc chèn `-<width>` trước phần mở rộng VÀ đổi phần mở rộng thành `.avif`,
 * vì biến thể luôn là AVIF bất kể ảnh gốc là .jpg/.png/.avif gì.
 *
 * KHÔNG có bước "URL đã có hậu tố mốc thì giữ nguyên" như bản GĐ1. Bản GĐ1 có
 * bước đó vì nội dung JSON tĩnh đôi khi trỏ thẳng vào một biến thể cụ thể.
 * Giờ mapMedia() luôn trả URL gốc (base upload), không bao giờ trả URL biến
 * thể, nên trường hợp đó không còn xảy ra trong đường đi thật của dữ liệu.
 *
 * Quan trọng hơn: giữ bước đó lại sẽ SAI. Regex đoán "tên file có đúng dạng
 * -<mốc>.<ext> thì chắc là biến thể rồi" chỉ là suy đoán theo tên — và một
 * ảnh GỐC hoàn toàn có thể mang tên trùng khớp một cách tình cờ (đúng thực tế
 * đã xảy ra: file placeholder tải lên tên "hero-2400.avif" — chỉ vì người đặt
 * tên file gốc chọn cái tên đó, ảnh chưa hề qua bước sinh biến thể nào). Với
 * bản GĐ1, guard đó âm thầm trả nguyên bản gốc cho MỌI mốc được yêu cầu —
 * điện thoại tải về ảnh 2400px, mọi biến thể đã sinh nằm không dùng, không
 * lỗi nào hiện ra. Không có cách nào phân biệt "đây là base" với "đây tình cờ
 * trùng tên biến thể" chỉ bằng tên file — nên cách an toàn nhất là BỎ HẲN suy
 * đoán đó: luôn tự dựng lại URL biến thể từ src truyền vào, không tin vào bề
 * ngoài của cái tên. Next/image luôn gọi loader với `src` gốc (không đổi) cho
 * từng mốc trong srcset, nên việc tự dựng lại này không bao giờ áp dụng lặp
 * (double-suffix) lên một URL đã qua loader trước đó.
 */
export default function mediaLoader({ src, width }: LoaderArgs): string {
  if (!laBlobUrl(src)) return src

  const target = MEDIA_WIDTHS.find((w) => w >= width) ?? MEDIA_WIDTHS[MEDIA_WIDTHS.length - 1]

  const lastDot = src.lastIndexOf('.')
  const lastSlash = src.lastIndexOf('/')
  if (lastDot === -1 || lastDot < lastSlash) return src

  return `${src.slice(0, lastDot)}-${target}.avif`
}
