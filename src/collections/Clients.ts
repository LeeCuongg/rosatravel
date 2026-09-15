import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access/roles'
import { validateHref } from '../fields/common'
import { revalidateCollection } from '../hooks/revalidate'
import { tags } from '../lib/cache-tags'

const revalidate = revalidateCollection(() => [tags.clients])

export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: { singular: 'Khách hàng doanh nghiệp', plural: 'Khách hàng doanh nghiệp' },
  admin: { group: 'Nội dung', useAsTitle: 'name', defaultColumns: ['name', 'order'] },
  defaultSort: 'order',
  access: { read: anyone, create: contentEditors, update: contentEditors, delete: contentEditors },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Tên doanh nghiệp', required: true, admin: { width: '70%' } },
        { name: 'order', type: 'number', label: 'Thứ tự', defaultValue: 0, admin: { width: '30%' } },
      ],
    },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo', required: true },
    { name: 'href', type: 'text', label: 'Link (bài viết hoặc website)', validate: validateHref },
  ],
}
