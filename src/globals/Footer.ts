import type { GlobalConfig } from 'payload'

import { anyone, contentEditors } from '../access/roles'
import { hrefField } from '../fields/common'
import { revalidateGlobal } from '../hooks/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Chân trang',
  admin: {
    group: 'Cấu hình site',
    description: 'Các cột link ở chân trang. Thông tin liên hệ và giới thiệu công ty sửa ở "Cài đặt chung".',
  },
  access: { read: anyone, update: contentEditors },
  hooks: { afterChange: [revalidateGlobal('footer')] },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Cột link',
      maxRows: 3,
      labels: { singular: 'Cột', plural: 'Cột' },
      fields: [
        { name: 'title', type: 'text', label: 'Tiêu đề cột', required: true, localized: true },
        {
          name: 'links',
          type: 'array',
          label: 'Link',
          labels: { singular: 'Link', plural: 'Link' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Tên', required: true, localized: true, admin: { width: '50%' } },
                hrefField({ width: '50%' }),
              ],
            },
          ],
        },
      ],
    },
  ],
}
