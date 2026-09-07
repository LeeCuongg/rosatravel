import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'

import { MEDIA_WIDTHS, OG_SIZE, generateBlurDataURL } from '@/lib/media/variants'
import { revalidateMoiTrangCoLocale } from '@/lib/revalidate'

const LARGEST_WIDTH = MEDIA_WIDTHS[MEDIA_WIDTHS.length - 1]

/**
 * Task 8 — "đăng là thấy ngay", phần dành cho ảnh.
 *
 * Sửa một bản ghi ảnh ĐỔI THẬT nội dung đang hiển thị, chứ không chỉ đổi thư
 * viện: `alt` được gõ một lần trên bản ghi ảnh rồi dùng lại ở mọi nơi (xem
 * README, mục Ảnh), còn khi thay file thì `url`, `width`, `height` và
 * `blurDataURL` đều đổi theo. Thay file là ca nguy hiểm nhất: tên file trên
 * Vercel Blob đổi, nên trang tour đã sinh tĩnh vẫn trỏ vào URL cũ và MỌI mục
 * trong `srcset` trả 404 — ảnh biến mất khỏi trang đang chạy mà không có thao
 * tác lưu nào báo lỗi.
 *
 * afterDelete cũng cần: xoá ảnh không kích hoạt afterChange (hai vòng đời
 * khác nhau trong Payload).
 *
 * Phạm vi là toàn bộ nhánh /[locale], không cố tính xem trang nào đang dùng
 * ảnh này. Một ảnh có thể nằm ở ảnh bìa tour, bộ ảnh, ảnh từng ngày, ảnh chia
 * sẻ mạng xã hội, banner trang chủ, chặng hành trình hoặc avatar cảm nhận —
 * truy ngược cho đủ nghĩa là truy vấn cả tour lẫn global home ngay trong hook,
 * và bỏ sót một chỗ thì hậu quả đúng bằng việc không có hook nào.
 */
const revalidateMediaAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateMoiTrangCoLocale()
  return doc
}

const revalidateMediaAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateMoiTrangCoLocale()
  return doc
}

/**
 * Collection Media — nơi duy nhất tạo ra file ảnh dùng trên toàn site.
 *
 * Đây là bản tự động hoá của script sinh biến thể ảnh chạy tay ở GĐ1 (đã xoá
 * khỏi repo ở Task 10, còn trong lịch sử git): thay vì người chạy tay một
 * script rồi copy đường dẫn vào JSON, nhân viên chỉ cần kéo ảnh vào /admin và
 * mọi biến thể + ảnh mờ được sinh ngay lúc lưu.
 *
 * QUAN TRỌNG — bài học từ GĐ1: loader `next/image` (src/lib/media/loader.ts)
 * là hàm thuần, luôn giả định đủ bốn mốc MEDIA_WIDTHS tồn tại cho mọi ảnh. Vì
 * vậy mỗi size dưới đây đặt `withoutEnlargement: true` thay vì để mặc định —
 * mặc định của Payload là ẨN (omit) hẳn một size nếu ảnh gốc nhỏ hơn mốc đó,
 * đúng là lỗi 404 ở breakpoint lớn mà GĐ1 đã gặp. `withoutEnlargement: true`
 * buộc Payload luôn sinh file ở mốc đó (bằng kích thước gốc nếu ảnh nhỏ hơn),
 * không bao giờ phóng to và không bao giờ bỏ qua.
 *
 * CHỈ DÙNG CHO ẢNH CÔNG KHAI.
 *
 * payload.config.ts đặt disablePayloadAccessControl: true cho collection này, nên
 * file nằm trên domain Blob và ai có URL đều xem được — vĩnh viễn, bất kể sau này
 * thêm access.read gì vào đây. Cờ đó ở cấp collection, không phải cấp bản ghi.
 *
 * Cần lưu tài sản riêng tư (ảnh giấy tờ, hợp đồng, chứng từ đặt tour)? Tạo
 * collection khác, KHÔNG dùng lại collection này.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Ảnh',
    plural: 'Thư viện ảnh',
  },
  upload: {
    imageSizes: [
      ...MEDIA_WIDTHS.map((width) => ({
        name: `w${width}`,
        width,
        withoutEnlargement: true,
        formatOptions: { format: 'avif' as const, options: { quality: 60 } },
        // Payload đặt tên file mặc định là "-<width>x<height>.<ext>". Chiều cao
        // phụ thuộc tỉ lệ khung hình của TỪNG ảnh, nên loader (hàm thuần, chỉ
        // nhận src + width) không thể suy ra URL mốc này từ URL mốc khác nếu
        // không biết trước chiều cao. Đặt lại tên chỉ theo bề rộng — đúng quy
        // ước "-<width>.<ext>" đã dùng từ GĐ1, tiếp tục dùng ở
        // src/lib/media/loader.ts — để loader suy ra URL bằng biến đổi chuỗi
        // thuần, không cần biết kích thước ảnh.
        generateImageName: ({ originalName, extension }: { originalName: string; extension: string }) =>
          `${originalName}-${width}.${extension}`,
      })),
      {
        name: 'og',
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        fit: 'cover' as const,
        // upload.focalPoint không bị tắt (mặc định bật) vì og thực sự crop —
        // người biên tập cần chỉnh được điểm lấy nét cho khung 1200x630. Hệ quả:
        // mọi ảnh đều mang focal point mặc định {x:50,y:50}, và cả bốn mốc AVIF
        // ở trên cũng đi qua nhánh resize-with-focal-point thay vì resize thường.
        // Vô hại với bốn mốc đó vì chúng chỉ ràng buộc bề rộng (không có height),
        // nên luôn giữ nguyên tỉ lệ khung hình gốc — không có gì để crop lệch.
        // Khi người biên tập chỉnh focal point cho og, các mốc bề rộng có thể xê
        // dịch nhẹ theo, nhưng vẫn full-bleed đúng tỉ lệ, không bao giờ crop.
        // false (chứ không phải mặc định undefined): og luôn phải đúng
        // 1200x630 cho Facebook/Zalo, kể cả khi ảnh gốc nhỏ hơn — chấp nhận
        // phóng to vì đây là ảnh chia sẻ mạng xã hội, không phải ảnh hiển thị
        // full-bleed trên site.
        withoutEnlargement: false,
        formatOptions: { format: 'jpeg' as const, options: { quality: 82 } },
        // Không hậu tố bề rộng trong tên file: URL og:image không đi qua
        // loader nên không cần khớp quy ước "-<width>.<ext>".
        generateImageName: ({ originalName, extension }) => `${originalName}-og.${extension}`,
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'group',
      label: 'Mô tả ảnh (cho người khiếm thị và SEO)',
      fields: [
        {
          name: 'vi',
          type: 'text',
          label: 'Tiếng Việt',
          required: true,
        },
        {
          name: 'en',
          type: 'text',
          label: 'Tiếng Anh',
        },
      ],
    },
    {
      name: 'blurDataURL',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      // Trường ảo, chỉ đọc — không lưu xuống DB, chỉ tính lại mỗi lần đọc doc.
      // Cảnh báo không chặn lưu: người nhập vẫn lưu được ảnh nhỏ, chỉ được
      // nhắc để thay ảnh tốt hơn nếu có.
      name: 'canhBaoKichThuoc',
      type: 'text',
      virtual: true,
      label: 'Cảnh báo kích thước ảnh',
      admin: {
        readOnly: true,
        condition: (_data, siblingData) =>
          typeof siblingData?.width === 'number' && siblingData.width < LARGEST_WIDTH,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            const width = siblingData?.width
            if (typeof width !== 'number' || width >= LARGEST_WIDTH) return undefined
            return `Ảnh chỉ rộng ${width}px, nhỏ hơn mốc lớn nhất ${LARGEST_WIDTH}px. Ảnh vẫn dùng được nhưng sẽ mờ trên màn hình lớn.`
          },
        ],
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const file = req.file
        if (file?.data) {
          data.blurDataURL = await generateBlurDataURL(file.data)
        }
        return data
      },
    ],
    afterChange: [revalidateMediaAfterChange],
    afterDelete: [revalidateMediaAfterDelete],
  },
}
