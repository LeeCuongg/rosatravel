import type { GlobalConfig } from 'payload'

import { anyone, contentEditors } from '../access/roles'
import { hrefField } from '../fields/common'
import { revalidateGlobal } from '../hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Menu đầu trang',
  admin: { group: 'Cấu hình site' },
  access: { read: anyone, update: contentEditors },
  hooks: { afterChange: [revalidateGlobal('header')] },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'Mục menu',
      maxRows: 8,
      labels: { singular: 'Mục menu', plural: 'Mục menu' },
      admin: { description: 'Kéo thả để đổi thứ tự. Nên để 4–6 mục.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Tên hiển thị',
              required: true,
              localized: true,
              admin: { width: '40%' },
            },
            hrefField({ width: '40%' }),
            {
              name: 'highlight',
              type: 'checkbox',
              label: 'Làm nổi (nền cam)',
              admin: { width: '20%' },
            },
          ],
        },
        {
          name: 'hasMegaMenu',
          type: 'checkbox',
          label: 'Có menu xổ xuống',
        },
        {
          name: 'megaMenu',
          type: 'group',
          label: 'Menu xổ xuống',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.hasMegaMenu) },
          fields: [
            {
              name: 'groups',
              type: 'array',
              label: 'Nhóm link',
              maxRows: 4,
              labels: { singular: 'Nhóm', plural: 'Nhóm' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      label: 'Tên nhóm',
                      required: true,
                      localized: true,
                      admin: { width: '50%' },
                    },
                    hrefField({ required: false, label: 'Link của tên nhóm', width: '50%' }),
                  ],
                },
                {
                  name: 'links',
                  type: 'array',
                  label: 'Link',
                  labels: { singular: 'Link', plural: 'Link' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'label',
                          type: 'text',
                          label: 'Tên',
                          required: true,
                          localized: true,
                          admin: { width: '50%' },
                        },
                        hrefField({ width: '50%' }),
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'featuredTours',
              type: 'relationship',
              relationTo: 'tours',
              hasMany: true,
              maxRows: 2,
              label: 'Tour nổi bật trong menu (tối đa 2)',
            },
          ],
        },
      ],
    },
  ],
}
