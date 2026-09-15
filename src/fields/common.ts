import type { Field, GroupField, TextField, TextFieldSingleValidation } from 'payload'

export const validateHref: TextFieldSingleValidation = (value) => {
  if (!value) return true
  return /^(\/(?!\/)|https?:\/\/|tel:|mailto:)/.test(value) || 'Link phải bắt đầu bằng "/" (trang trong site) hoặc "https://"'
}

export const validateUrl: TextFieldSingleValidation = (value) => {
  if (!value) return true
  return /^https?:\/\//.test(value) || 'Link phải bắt đầu bằng "https://"'
}

export function hrefField(
  options: { name?: string; label?: string; required?: boolean; width?: string } = {},
): TextField {
  return {
    name: options.name ?? 'href',
    type: 'text',
    label: options.label ?? 'Đường dẫn',
    required: options.required ?? true,
    validate: validateHref,
    admin: {
      width: options.width,
      description: 'Trang trong site: /tour/ha-giang · Trang ngoài: https://…',
    },
  }
}

/** Nhóm link "Xem thêm" dưới/trên một section. Để trống thì không hiện link. */
export function viewAllField(): GroupField {
  return {
    name: 'viewAll',
    type: 'group',
    label: 'Link "Xem thêm"',
    admin: { description: 'Để trống đường dẫn thì không hiện link.' },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'label',
            type: 'text',
            label: 'Chữ hiển thị',
            localized: true,
            admin: { width: '40%', placeholder: 'Xem thêm' },
          },
          hrefField({ required: false, width: '60%' }),
        ],
      },
    ],
  }
}

export const seoField: GroupField = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: { description: 'Để trống thì dùng tiêu đề, mô tả ngắn và ảnh bìa.' },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề SEO', localized: true, maxLength: 70 },
    { name: 'description', type: 'textarea', label: 'Mô tả SEO', localized: true, maxLength: 160 },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Ảnh chia sẻ mạng xã hội' },
  ],
}

export function titleField(label = 'Tiêu đề khối'): Field {
  return { name: 'title', type: 'text', label, localized: true }
}
