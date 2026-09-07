import type {
  ArrayFieldValidation,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Field,
  FieldHook,
  NumberFieldSingleValidation,
  TextFieldValidation,
} from 'payload'

import { routing } from '../i18n/routing'
import { revalidatePathAnToan } from '../lib/revalidate'

/**
 * Collection Tours — nơi nhân viên nhập nội dung một tour du lịch.
 *
 * Đây là "hợp đồng" phía Payload của `tourSchema` (src/lib/content/schema.ts).
 * Task 5 sẽ đọc document từ collection này, ánh xạ sang hình dạng `Tour` và
 * validate lại bằng zod trước khi build site. Không có gì tự động giữ hai
 * bên khớp nhau — sai lệch ở đây chỉ lộ ra khi Task 5 chạy, nên các ràng
 * buộc quan trọng (số ngày lịch trình, định dạng slug...) được kiểm tra
 * ngay tại đây để người nhập liệu sửa được trong lúc họ còn đang mở form.
 *
 * KHÔNG khai trường `currency`: tourSchema bắt buộc nó là hằng số 'VND' —
 * bắt người nhập chọn một giá trị duy nhất trong danh sách là phiền vô ích.
 * Task 5 gán cứng 'VND' khi ánh xạ.
 *
 * KHÔNG lưu `itinerary[].day`: itineraryDaySchema có trường `day` (số thứ
 * tự ngày), nhưng vị trí của một phần tử trong mảng `itinerary` đã LÀ số
 * ngày đó (phần tử đầu = ngày 1, phần tử thứ hai = ngày 2, ...). Task 5 suy
 * ra `day` từ chỉ số mảng (index + 1) thay vì đọc một trường lưu trùng lặp
 * mà người nhập có thể gõ sai.
 *
 * `displayTitle` (bên dưới) tồn tại chỉ để làm `useAsTitle`: Payload từ chối
 * cả field lồng trong group ('title.vi' — lỗi InvalidConfiguration lúc khởi
 * động) LẪN field ảo thường (virtual: true kiểu `canhBaoKichThuoc` của
 * Media.ts — lỗi tương tự, vì "A virtual field can be used as the title only
 * when linked to a relationship field"). Cách còn lại là một field thật,
 * lưu xuống DB, được đồng bộ tự động từ `title.vi` bằng hook — không bắt
 * người nhập gõ tên tour hai lần.
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

const validateSlug: TextFieldValidation = (value) => {
  if (!value) {
    return 'Đường dẫn là bắt buộc'
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
    return 'Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang (ví dụ: sa-pa-3-ngay-2-dem)'
  }
  return true
}

const validateDurationDays: NumberFieldSingleValidation = (value) => {
  if (value === undefined || value === null) {
    return 'Số ngày là bắt buộc'
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Số ngày phải là một con số'
  }
  if (!Number.isInteger(value)) {
    return 'Số ngày phải là số nguyên (không có phần thập phân)'
  }
  if (value <= 0) {
    return 'Số ngày phải lớn hơn 0'
  }
  return true
}

const validatePriceFrom: NumberFieldSingleValidation = (value) => {
  if (value === undefined || value === null) {
    return 'Giá từ là bắt buộc'
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Giá từ phải là một con số'
  }
  if (value <= 0) {
    return 'Giá từ phải lớn hơn 0'
  }
  return true
}

/**
 * Đồng bộ `displayTitle` (field thật, dùng cho useAsTitle) từ `title.vi`.
 *
 * Phải rơi về `originalDoc?.title?.vi` khi `data` không có `title`: field này
 * có `admin.readOnly: true`, nhưng đó chỉ là ràng buộc trên giao diện admin,
 * không phải access control. Một request qua REST/Local API có thể gửi thẳng
 * `displayTitle` mà không kèm `title` trong cùng payload — nếu hook chỉ đọc
 * `data`, giá trị client gửi lên sẽ được giữ nguyên (vì `data?.title?.vi` là
 * undefined nên nhánh trả undefined, và Payload giữ giá trị cũ/giá trị gửi
 * lên tuỳ operation), khiến danh sách tour hiện một cái tên trông hợp lý
 * nhưng sai, không có gì báo hiệu. Rơi về `originalDoc` buộc field luôn được
 * suy lại từ nguồn thật (title.vi đã lưu), không bao giờ tin trực tiếp giá
 * trị displayTitle được gửi lên.
 */
const syncDisplayTitle: FieldHook = ({ data, originalDoc }) => {
  const dataVi = (data as { title?: { vi?: string } } | undefined)?.title?.vi
  const originalVi = (originalDoc as { title?: { vi?: string } } | undefined)?.title?.vi
  const vi = dataVi ?? originalVi
  return typeof vi === 'string' && vi.length > 0 ? vi : undefined
}

/**
 * Task 8 — "đăng là thấy ngay". Mọi trang trong site được sinh tĩnh (không có
 * `export const revalidate`/`dynamic` nào trong src/app), nên nội dung cũ
 * sống mãi trong cache tới khi có on-demand revalidation. Payload chạy CHUNG
 * tiến trình Next.js (route handler tại src/app/(payload)/api/[...slug] —
 * xem payload.config.ts) nên hook ở đây gọi thẳng revalidatePath, không cần
 * webhook gọi ra ngoài. Việc bắt lỗi "gọi ngoài request Next.js" (vd. khi một
 * script độc lập chạy bằng tsx gọi Local API) nằm ở src/lib/revalidate.ts —
 * dùng chung với Home.ts, không lặp lại ở đây.
 */

/** Làm mới trang tour + trang chủ (có thể đang hiện tour này ở danh sách nổi bật) cho mọi locale. */
function revalidateTourAndHome(slug: string): void {
  for (const locale of routing.locales) {
    revalidatePathAnToan(`/${locale}/tour/${slug}`)
    revalidatePathAnToan(`/${locale}`)
  }
}

/**
 * afterChange: sửa nội dung một tour đã có phải lên trang trong vài giây,
 * không cần rebuild. Slug có thể đổi giữa các lần lưu — Payload cung cấp cả
 * doc mới lẫn previousDoc, nên vừa làm mới đường dẫn mới vừa làm mới đường
 * dẫn CŨ; bỏ sót đường dẫn cũ sẽ để lại một trang tĩnh mồ côi, trỏ tới nội
 * dung không còn ở đó nữa. Tour mới tạo, hoặc slug đổi, còn cần làm mới
 * sitemap.xml — danh sách URL nó liệt kê phải khớp danh sách tour thật.
 */
const revalidateToursAfterChange: CollectionAfterChangeHook = ({ doc, previousDoc, operation }) => {
  const slug = (doc as { slug?: string }).slug
  const previousSlug = (previousDoc as { slug?: string } | undefined)?.slug
  if (typeof slug !== 'string' || slug.length === 0) return doc

  revalidateTourAndHome(slug)

  const slugChanged = operation === 'update' && typeof previousSlug === 'string' && previousSlug !== slug
  if (slugChanged) {
    revalidateTourAndHome(previousSlug)
  }

  if (operation === 'create' || slugChanged) {
    revalidatePathAnToan('/sitemap.xml')
  }

  return doc
}

/**
 * afterDelete: `afterChange` KHÔNG chạy khi xoá document (đây là hai vòng đời
 * khác nhau trong Payload) — thiếu hook riêng này, trang tour đã xoá vẫn còn
 * phục vụ bản tĩnh cũ vô thời hạn. Cũng làm mới trang chủ (tour xoá có thể
 * đang nằm trong danh sách nổi bật) và sitemap (không được liệt kê URL đã
 * chết).
 */
const revalidateToursAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  const slug = (doc as { slug?: string } | undefined)?.slug
  if (typeof slug !== 'string' || slug.length === 0) return doc

  revalidateTourAndHome(slug)
  revalidatePathAnToan('/sitemap.xml')

  return doc
}

/**
 * Ràng buộc cốt lõi của task này: số phần tử trong `itinerary` phải khớp
 * `durationDays`. `data` là dữ liệu toàn bộ document (đây là field cấp cao
 * nhất, không nằm trong group/array khác) nên đọc thẳng `data.durationDays`
 * để so sánh. Nếu durationDays chưa hợp lệ thì bỏ qua — lỗi đã hiện sẵn ở
 * chính trường đó, không cần lặp lại thông báo ở đây.
 */
const validateItineraryMatchesDuration: ArrayFieldValidation = (value, { data }) => {
  const rows = Array.isArray(value) ? value : []
  const duration = (data as { durationDays?: unknown } | undefined)?.durationDays
  if (typeof duration !== 'number' || !Number.isInteger(duration) || duration <= 0) {
    return true
  }
  if (rows.length !== duration) {
    return `Lịch trình có ${rows.length} ngày nhưng Số ngày là ${duration}. Hai số này phải khớp nhau.`
  }
  return true
}

export const Tours: CollectionConfig = {
  slug: 'tours',
  labels: {
    singular: 'Tour',
    plural: 'Tour',
  },
  admin: {
    // Xem giải thích ở comment đầu file: 'displayTitle' là field thật, đồng
    // bộ tự động từ title.vi, vì Payload không chấp nhận field lồng trong
    // group hay field ảo thường làm useAsTitle. Vẫn giữ slug làm cột riêng
    // vì nhân viên cần nó để lấy URL.
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'slug', 'durationDays', 'priceFrom'],
  },
  hooks: {
    afterChange: [revalidateToursAfterChange],
    afterDelete: [revalidateToursAfterDelete],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      label: 'Đường dẫn (chữ thường, không dấu)',
      required: true,
      unique: true,
      validate: validateSlug,
    },
    {
      name: 'title',
      type: 'group',
      label: 'Tên tour',
      fields: [viTextGroup('Tiếng Việt')],
    },
    {
      name: 'displayTitle',
      type: 'text',
      label: 'Tên hiển thị',
      admin: {
        readOnly: true,
        description:
          'Tự động lấy từ "Tên tour" ở trên — không cần nhập tay. Dùng để hiển thị trong danh sách tour và trên đầu trang quản trị.',
      },
      hooks: {
        beforeChange: [syncDisplayTitle],
      },
    },
    {
      name: 'tagline',
      type: 'group',
      label: 'Câu giới thiệu ngắn',
      fields: [viTextGroup('Tiếng Việt')],
    },
    {
      name: 'summary',
      type: 'group',
      label: 'Mô tả tổng quan',
      fields: [viTextGroup('Tiếng Việt', 'textarea')],
    },
    {
      name: 'durationDays',
      type: 'number',
      label: 'Số ngày',
      required: true,
      min: 1,
      validate: validateDurationDays,
    },
    {
      name: 'priceFrom',
      type: 'number',
      label: 'Giá từ (VND)',
      required: true,
      min: 1,
      admin: {
        description: 'Nhập số nguyên, không dấu chấm hay dấu phẩy. Ví dụ: 6900000 nghĩa là 6.900.000đ.',
      },
      validate: validatePriceFrom,
    },
    {
      name: 'destinations',
      type: 'array',
      label: 'Điểm đến',
      // required: true bắt buộc — nếu chỉ có minRows mà thiếu required thì
      // validateArrayLength (payload/dist/fields/validations.js) trả về true
      // ngay khi mảng rỗng, không bao giờ đọc tới minRows. Payload
      // validation của bản thân array cũng bị bỏ qua trên client, nên UI
      // không cảnh báo gì cả — mảng 0 dòng lưu được êm re.
      required: true,
      minRows: 1,
      fields: [viTextGroup('Tiếng Việt')],
    },
    {
      name: 'heroMedia',
      type: 'relationship',
      relationTo: 'media',
      label: 'Ảnh bìa',
      required: true,
    },
    {
      name: 'gallery',
      type: 'relationship',
      relationTo: 'media',
      label: 'Bộ ảnh',
      hasMany: true,
      minRows: 1,
      required: true,
    },
    {
      name: 'itinerary',
      type: 'array',
      label: 'Lịch trình từng ngày',
      // Không đặt minRows ở đây: một khi field có `validate` riêng thì
      // Payload dùng validate đó THAY CHO TOÀN BỘ default validate (kể cả
      // phần đọc minRows) — sanitizeFields chỉ gắn validate mặc định khi
      // field.validate === undefined. minRows sẽ là dead code, không ai gọi
      // tới. Không sao: validateItineraryMatchesDuration đã bao luôn ràng
      // buộc "không được rỗng", vì durationDays luôn > 0 (ép bởi
      // validateDurationDays) nên rows.length phải khớp một số > 0.
      validate: validateItineraryMatchesDuration,
      fields: [
        {
          name: 'title',
          type: 'group',
          label: 'Tiêu đề ngày',
          fields: [viTextGroup('Tiếng Việt')],
        },
        {
          name: 'description',
          type: 'group',
          label: 'Mô tả ngày',
          fields: [viTextGroup('Tiếng Việt', 'textarea')],
        },
        {
          name: 'media',
          type: 'relationship',
          relationTo: 'media',
          label: 'Ảnh của ngày',
          required: false,
        },
      ],
    },
    {
      name: 'inclusions',
      type: 'array',
      label: 'Bao gồm',
      // required: true — xem giải thích ở field 'destinations' phía trên,
      // cùng lỗi minRows-không-tác-dụng-nếu-thiếu-required.
      required: true,
      minRows: 1,
      admin: {
        description: 'Những gì khách được hưởng khi mua tour.',
      },
      fields: [viTextGroup('Tiếng Việt')],
    },
    {
      name: 'exclusions',
      type: 'array',
      label: 'Không bao gồm',
      admin: {
        description: 'Những chi phí khách tự lo, không nằm trong giá tour.',
      },
      fields: [viTextGroup('Tiếng Việt')],
    },
    {
      name: 'notes',
      type: 'group',
      label: 'Ghi chú',
      fields: [viTextGroup('Tiếng Việt', 'textarea', false)],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        {
          name: 'title',
          type: 'group',
          label: 'Tiêu đề SEO',
          admin: {
            description:
              'Dòng chữ hiện trên tab trình duyệt và trên kết quả tìm kiếm Google. Nên ngắn gọn, chứa tên tour.',
          },
          fields: [viTextGroup('Tiếng Việt')],
        },
        {
          name: 'description',
          type: 'group',
          label: 'Mô tả SEO',
          admin: {
            description:
              'Đoạn tóm tắt hiện dưới tiêu đề trên kết quả tìm kiếm Google và khi chia sẻ link tour lên Zalo/Facebook.',
          },
          fields: [viTextGroup('Tiếng Việt', 'textarea')],
        },
        {
          name: 'ogImage',
          type: 'relationship',
          relationTo: 'media',
          label: 'Ảnh chia sẻ mạng xã hội',
          required: true,
        },
      ],
    },
  ],
}
