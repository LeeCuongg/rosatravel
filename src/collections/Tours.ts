import type {
  ArrayFieldValidation,
  CollectionConfig,
  Field,
  NumberFieldSingleValidation,
  TextFieldValidation,
} from 'payload'

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
    // Payload không cho useAsTitle trỏ vào field lồng trong group (chỉ nhận
    // field cấp cao nhất) — 'title.vi' bị InvalidConfiguration khi khởi động.
    // Dùng slug vì nó cũng là field cấp cao nhất, duy nhất, luôn có giá trị.
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'durationDays', 'priceFrom'],
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
      validate: validatePriceFrom,
    },
    {
      name: 'destinations',
      type: 'array',
      label: 'Điểm đến',
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
      minRows: 1,
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
      minRows: 1,
      fields: [viTextGroup('Tiếng Việt')],
    },
    {
      name: 'exclusions',
      type: 'array',
      label: 'Không bao gồm',
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
          fields: [viTextGroup('Tiếng Việt')],
        },
        {
          name: 'description',
          type: 'group',
          label: 'Mô tả SEO',
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
