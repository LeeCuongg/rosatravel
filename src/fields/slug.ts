import { slugField, type CheckboxField, type TextField } from 'payload'

import { slugifyVi } from '../lib/slugify'

/** Slug tự sinh từ tiêu đề, bỏ dấu tiếng Việt, nằm ở cột bên phải. */
export function viSlugField(useAsSlug = 'title') {
  return slugField({
    useAsSlug,
    localized: true,
    position: 'sidebar',
    slugify: ({ valueToSlugify }) => (typeof valueToSlugify === 'string' ? slugifyVi(valueToSlugify) : undefined),
    overrides: (row) => {
      for (const field of row.fields) {
        if (!('name' in field)) continue
        if (field.name === 'generateSlug') {
          ;(field as CheckboxField).label = 'Tự tạo từ tiêu đề'
        }
        if (field.name === 'slug') {
          const slug = field as TextField
          slug.label = 'Đường dẫn (slug)'
          slug.admin = {
            ...slug.admin,
            description:
              'Phần cuối của URL, vd. tour-ha-giang-3-ngay. Đổi slug của nội dung đã đăng sẽ làm hỏng link cũ.',
          }
        }
      }
      return row
    },
  })
}
