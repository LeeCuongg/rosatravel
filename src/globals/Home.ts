import { revalidatePath } from 'next/cache'
import type { Field, GlobalAfterChangeHook, GlobalConfig, TextFieldValidation } from 'payload'

import { routing } from '../i18n/routing'

/**
 * Global Home — nội dung trang chủ, nhập một lần và luôn chỉ có một bản ghi
 * (global, không phải collection).
 *
 * Đây là "hợp đồng" phía Payload của `homeContentSchema`
 * (src/lib/content/schema.ts). Task 5 đọc document của global này, ánh xạ
 * sang hình dạng `HomeContent` và validate lại bằng zod trước khi build
 * site. Không có gì tự động giữ hai bên khớp nhau — sai lệch ở đây chỉ lộ ra
 * khi Task 5 chạy, nên các ràng buộc quan trọng (số điểm đến tối thiểu,
 * định dạng URL Zalo...) được kiểm tra ngay tại đây để người nhập liệu sửa
 * được trong lúc họ còn đang mở form.
 *
 * `featuredTours` là quan hệ thật tới collection `tours` (không phải mảng
 * chuỗi slug): người nhập chọn tour từ danh sách có sẵn, nên không thể trỏ
 * tới một tour không tồn tại — loại bỏ hẳn lớp lỗi mà GĐ1 phải viết test
 * riêng để bắt. Schema zod (`featuredTourSlugs: z.array(z.string())`)
 * KHÔNG đổi; Task 5 là nơi chuyển quan hệ Payload thành mảng slug.
 *
 * `journey.stops` bắt buộc tối thiểu 2: `JourneyCinematic` tính quãng cuộn
 * ngang từ tổng bề rộng các điểm đến — dưới 2 điểm thì quãng cuộn bằng 0 và
 * section pin sẽ khoá màn hình mà không có gì di chuyển. GĐ1 đã thêm
 * `Math.max(0, ...)` để chặn ở tầng hiển thị, nhưng chặn ngay tại đây thì
 * người nhập biết ngay trong lúc còn đang mở form, không phải đợi tới khi
 * xem trang mới phát hiện màn hình bị khoá.
 */

/** Nhóm văn bản song ngữ, hiện chỉ có tiếng Việt — tiếng Anh để dành cho GĐ sau. */
function viTextGroup(label: string, required?: boolean): Field
function viTextGroup(label: string, fieldType: 'textarea', required?: boolean): Field
function viTextGroup(label: string, fieldTypeOrRequired?: 'textarea' | boolean, maybeRequired = true): Field {
  const isTextarea = fieldTypeOrRequired === 'textarea'
  const required = isTextarea ? maybeRequired : (fieldTypeOrRequired ?? true)
  return isTextarea
    ? { name: 'vi', type: 'textarea', label, required }
    : { name: 'vi', type: 'text', label, required }
}

/** homeContentSchema.contact.zaloUrl dùng z.url() — kiểm định dạng URL ngay tại form. */
const validateZaloUrl: TextFieldValidation = (value) => {
  if (!value) {
    return 'Link Zalo là bắt buộc'
  }
  try {
    new URL(value)
  } catch {
    return 'Link Zalo phải là một URL hợp lệ (ví dụ: https://zalo.me/...)'
  }
  return true
}

/**
 * Task 8 — "đăng là thấy ngay". Trang chủ được sinh tĩnh (không có
 * `export const revalidate`/`dynamic` trong src/app/[locale]/page.tsx), nên
 * sửa global `home` trong admin không tự động hiện trên site tới khi có
 * on-demand revalidation. Payload chạy CHUNG tiến trình Next.js nên gọi thẳng
 * revalidatePath, không cần webhook.
 *
 * Cùng lý do bọc try/catch như src/collections/Tours.ts: revalidatePath() chỉ
 * hoạt động khi đang chạy TRONG một request Next.js (đọc AsyncLocalStorage
 * nội bộ của Next). Khi admin lưu qua route handler REST của Payload thì có
 * — hoạt động bình thường. Khi Payload Local API được gọi từ script độc lập
 * ngoài tiến trình Next (vd. `pnpm seed`), không có — nó ném "Invariant:
 * static generation store missing". Không để lỗi dọn cache đó làm hỏng chính
 * thao tác lưu.
 */
const revalidateHomeAfterChange: GlobalAfterChangeHook = ({ doc }) => {
  for (const locale of routing.locales) {
    try {
      revalidatePath(`/${locale}`)
    } catch (err) {
      console.warn(
        `[revalidate] Bỏ qua lỗi revalidatePath("/${locale}") — có thể đang chạy ngoài request Next.js:`,
        err,
      )
    }
  }
  return doc
}

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Trang chủ',
  admin: {
    description: 'Nội dung hiển thị trên trang chủ. Chỉ có một bản ghi duy nhất.',
  },
  hooks: {
    afterChange: [revalidateHomeAfterChange],
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Banner đầu trang',
      fields: [
        {
          name: 'headline',
          type: 'group',
          label: 'Tiêu đề lớn',
          fields: [viTextGroup('Tiếng Việt')],
        },
        {
          name: 'subline',
          type: 'group',
          label: 'Câu phụ dưới tiêu đề',
          fields: [viTextGroup('Tiếng Việt', 'textarea')],
        },
        {
          name: 'media',
          type: 'relationship',
          relationTo: 'media',
          label: 'Ảnh nền trang chủ',
          required: true,
        },
      ],
    },
    {
      name: 'whyUs',
      type: 'array',
      label: 'Vì sao chọn chúng tôi',
      // required: true bắt buộc đi kèm minRows — xem giải thích trong
      // Tours.ts (field 'destinations'): validateArrayLength trả về true
      // ngay khi mảng rỗng nếu thiếu required, minRows không bao giờ được
      // đọc tới, và mảng 0 dòng lưu được êm re.
      required: true,
      minRows: 1,
      admin: {
        description: 'Mỗi lý do gồm một tiêu đề ngắn và một đoạn giải thích.',
      },
      fields: [
        {
          name: 'title',
          type: 'group',
          label: 'Tiêu đề',
          fields: [viTextGroup('Tiếng Việt')],
        },
        {
          name: 'body',
          type: 'group',
          label: 'Nội dung',
          fields: [viTextGroup('Tiếng Việt', 'textarea')],
        },
      ],
    },
    {
      name: 'featuredTours',
      type: 'relationship',
      relationTo: 'tours',
      hasMany: true,
      label: 'Tour nổi bật',
      // Cùng lý do required+minRows như trên, áp dụng cho relationship hasMany
      // (xem Tours.ts field 'gallery' — cùng khuôn mẫu đã dùng ở Task 3).
      required: true,
      minRows: 1,
      admin: {
        description: 'Chọn các tour sẽ hiện nổi bật trên trang chủ, từ danh sách tour đã tạo.',
      },
    },
    {
      name: 'journey',
      type: 'group',
      label: 'Hành trình',
      fields: [
        {
          name: 'headline',
          type: 'group',
          label: 'Tiêu đề mục Hành trình',
          fields: [viTextGroup('Tiếng Việt')],
        },
        {
          name: 'stops',
          type: 'array',
          label: 'Các điểm đến',
          // Tối thiểu 2 — ràng buộc thật, không phải tuỳ ý: xem giải thích ở
          // đầu file. required: true bắt buộc đi kèm minRows, cùng lý do đã
          // nêu ở field 'whyUs' phía trên.
          required: true,
          minRows: 2,
          admin: {
            description:
              'Cần tối thiểu 2 điểm đến — hiệu ứng cuộn ngang trên trang chủ không hoạt động với ít hơn 2.',
          },
          fields: [
            {
              name: 'label',
              type: 'group',
              label: 'Tên điểm đến',
              fields: [viTextGroup('Tiếng Việt')],
            },
            {
              name: 'image',
              type: 'relationship',
              relationTo: 'media',
              label: 'Ảnh điểm đến',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'testimonials',
      type: 'array',
      label: 'Cảm nhận khách hàng',
      admin: {
        description: 'Có thể để trống nếu chưa có cảm nhận nào để đăng.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Tên khách hàng',
          required: true,
        },
        {
          name: 'quote',
          type: 'group',
          label: 'Cảm nhận',
          fields: [viTextGroup('Tiếng Việt', 'textarea')],
        },
        {
          name: 'tour',
          type: 'relationship',
          relationTo: 'tours',
          label: 'Tour liên quan',
          required: false,
          admin: {
            description: 'Không bắt buộc — chỉ chọn nếu cảm nhận này gắn với một tour cụ thể.',
          },
        },
        {
          name: 'avatar',
          type: 'relationship',
          relationTo: 'media',
          label: 'Ảnh đại diện',
          required: false,
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Thông tin liên hệ',
      fields: [
        {
          name: 'phone',
          type: 'text',
          label: 'Số điện thoại',
          required: true,
        },
        {
          name: 'zaloUrl',
          type: 'text',
          label: 'Link Zalo',
          required: true,
          validate: validateZaloUrl,
          admin: {
            description: 'URL đầy đủ, ví dụ: https://zalo.me/0901234567',
          },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email nhận yêu cầu',
          required: true,
        },
      ],
    },
  ],
}
