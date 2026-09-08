import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Field,
  FieldHook,
  TextFieldValidation,
} from 'payload'

import { revalidateMoiTrangCoLocale, revalidatePathAnToan } from '../lib/revalidate'

/**
 * MẢNH GHÉP DÙNG CHUNG CHO MỌI COLLECTION.
 *
 * Trước GĐ3 chỉ có hai collection nên `viTextGroup`, `validateSlug` và
 * `syncDisplayTitle` được chép nguyên si trong Tours.ts và Home.ts. GĐ3 thêm
 * hai collection nữa (Locations, CaseStudies); bốn bản sao của cùng một hàm là
 * bốn chỗ phải nhớ sửa khi thêm tiếng Anh, và chắc chắn sẽ có chỗ bị bỏ quên.
 *
 * File này KHÔNG phải nơi chứa mọi thứ dùng chung — chỉ những mảnh đã thật sự
 * lặp lại ở từ hai collection trở lên.
 */

/** Nhóm văn bản song ngữ, hiện chỉ có tiếng Việt — tiếng Anh để dành cho GĐ sau. */
export function viTextGroup(label: string, required?: boolean): Field
export function viTextGroup(label: string, fieldType: 'textarea', required?: boolean): Field
export function viTextGroup(
  label: string,
  fieldTypeOrRequired?: 'textarea' | boolean,
  maybeRequired = true,
): Field {
  const isTextarea = fieldTypeOrRequired === 'textarea'
  const required = isTextarea ? maybeRequired : (fieldTypeOrRequired ?? true)
  return isTextarea
    ? { name: 'vi', type: 'textarea', label, required }
    : { name: 'vi', type: 'text', label, required }
}

export const validateSlug: TextFieldValidation = (value) => {
  if (!value) {
    return 'Đường dẫn là bắt buộc'
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
    return 'Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang (ví dụ: sa-pa-3-ngay-2-dem)'
  }
  return true
}

/**
 * Đồng bộ `displayTitle` (field thật, dùng cho useAsTitle) từ một nhóm văn bản
 * song ngữ khác trên cùng document.
 *
 * Vì sao cần `displayTitle` thay vì trỏ thẳng useAsTitle vào 'title.vi': Payload
 * từ chối cả field lồng trong group (lỗi InvalidConfiguration lúc khởi động) LẪN
 * field ảo thường. Cách còn lại là một field thật, lưu xuống DB, đồng bộ tự động
 * bằng hook — không bắt người nhập gõ tên hai lần.
 *
 * Phải rơi về `originalDoc` khi `data` không có trường nguồn: `admin.readOnly`
 * chỉ là ràng buộc trên giao diện admin, không phải access control. Một request
 * qua REST/Local API có thể gửi thẳng `displayTitle` mà không kèm trường nguồn —
 * nếu hook chỉ đọc `data`, giá trị client gửi lên sẽ được giữ nguyên, khiến danh
 * sách trong admin hiện một cái tên trông hợp lý nhưng sai, không có gì báo hiệu.
 */
export function taoSyncDisplayTitle(truongNguon: string): FieldHook {
  return ({ data, originalDoc }) => {
    const doc = (nguon: unknown) =>
      (nguon as Record<string, { vi?: string } | undefined> | undefined)?.[truongNguon]?.vi
    const vi = doc(data) ?? doc(originalDoc)
    return typeof vi === 'string' && vi.length > 0 ? vi : undefined
  }
}

/** Field `displayTitle` hoàn chỉnh, đã gắn sẵn hook đồng bộ. */
export function displayTitleField(truongNguon: string, nhanNguon: string): Field {
  return {
    name: 'displayTitle',
    type: 'text',
    label: 'Tên hiển thị',
    admin: {
      readOnly: true,
      description: `Tự động lấy từ "${nhanNguon}" ở trên — không cần nhập tay. Dùng để hiển thị trong danh sách và trên đầu trang quản trị.`,
    },
    hooks: {
      beforeChange: [taoSyncDisplayTitle(truongNguon)],
    },
  }
}

/**
 * Cặp hook "đăng là thấy ngay" cho một collection có trang riêng theo slug.
 *
 * Làm mới TOÀN BỘ nhánh /[locale] chứ không phải từng đường dẫn — lý do đầy đủ
 * ở src/lib/revalidate.ts. Tóm tắt: sửa một bản ghi không chỉ đổi trang của
 * chính nó mà còn đổi mọi danh sách nhắc tới nó, và làm mới theo layout bao
 * trọn tất cả kể cả khi slug vừa đổi.
 *
 * sitemap.xml nằm NGOÀI nhánh /[locale] nên phải làm mới riêng, và chỉ cần khi
 * tập hợp URL đổi: tạo mới, đổi slug, hoặc xoá.
 */
export function taoRevalidateHooks(): {
  afterChange: CollectionAfterChangeHook
  afterDelete: CollectionAfterDeleteHook
} {
  return {
    afterChange: ({ doc, previousDoc, operation }) => {
      // Không chốt theo slug trước: lời gọi làm mới nhánh /[locale] không cần
      // tới slug. Chốt sớm sẽ bỏ qua TOÀN BỘ việc làm mới cho một document
      // thiếu slug.
      revalidateMoiTrangCoLocale()

      const slug = (doc as { slug?: string }).slug
      const previousSlug = (previousDoc as { slug?: string } | undefined)?.slug
      const slugChanged =
        operation === 'update' &&
        typeof slug === 'string' &&
        typeof previousSlug === 'string' &&
        previousSlug !== slug
      if (operation === 'create' || slugChanged) {
        revalidatePathAnToan('/sitemap.xml')
      }

      return doc
    },
    afterDelete: ({ doc }) => {
      revalidateMoiTrangCoLocale()
      revalidatePathAnToan('/sitemap.xml')
      return doc
    },
  }
}

/**
 * Nhóm SEO dùng chung. Ba trường này hiện trên tab trình duyệt, kết quả tìm
 * kiếm và thẻ chia sẻ mạng xã hội — hướng người đọc, nên bọc locale như mọi
 * trường văn bản khác.
 */
export function seoGroup(): Field {
  return {
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
            'Dòng chữ hiện trên tab trình duyệt và trên kết quả tìm kiếm Google. Nên ngắn gọn.',
        },
        fields: [viTextGroup('Tiếng Việt')],
      },
      {
        name: 'description',
        type: 'group',
        label: 'Mô tả SEO',
        admin: {
          description:
            'Đoạn tóm tắt hiện dưới tiêu đề trên kết quả tìm kiếm Google và khi chia sẻ link lên Zalo/Facebook.',
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
  }
}

/**
 * Mảng đoạn văn. Dùng thay cho trình soạn thảo rich text (lexical) ở MỌI chỗ
 * cần nhiều đoạn.
 *
 * Vì sao không dùng lexical: nội dung phải đi qua zod rồi mới tới component, và
 * cây JSON của lexical thì không có hình dạng cố định — mỗi nút có thể là văn
 * bản, liên kết, danh sách, ảnh nhúng, hoặc một định dạng người nhập vô tình
 * bấm phải. Ánh xạ nó an toàn tốn nhiều công hơn giá trị nó mang lại ở đây,
 * còn ánh xạ ẩu thì một lần dán chữ từ Word cũng đủ làm vỡ build.
 *
 * Một mảng đoạn văn thuần cho ra đúng thứ trang cần và không bao giờ hỏng.
 */
export function doanVanArray(name: string, label: string, batBuoc = true): Field {
  return {
    name,
    type: 'array',
    label,
    // required: true bắt buộc đi kèm minRows — thiếu required thì
    // validateArrayLength của Payload trả true ngay khi mảng rỗng và minRows
    // không bao giờ được đọc tới (xem giải thích dài ở Tours.ts).
    ...(batBuoc ? { required: true, minRows: 1 } : {}),
    admin: { description: 'Mỗi dòng là một đoạn văn.' },
    fields: [viTextGroup('Tiếng Việt', 'textarea')],
  }
}
