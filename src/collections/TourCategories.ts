import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access/roles'
import { seoField } from '../fields/common'
import { viSlugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { tags } from '../lib/cache-tags'

const revalidate = revalidateCollection<{ slug?: string | null }>((doc) => [
  tags.categories,
  doc.slug ? tags.category(doc.slug) : '',
])

export const TourCategories: CollectionConfig = {
  slug: 'tour-categories',
  labels: { singular: 'Danh mục tour', plural: 'Danh mục tour' },
  admin: {
    group: 'Tour',
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'order'],
    description: 'Nhóm tour hiện trên menu, trang chủ và trang danh mục, vd. "Tour mùa thu", "Tour đoàn riêng".',
  },
  defaultSort: 'order',
  access: { read: anyone, create: contentEditors, update: contentEditors, delete: contentEditors },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'name', type: 'text', label: 'Tên danh mục', required: true, localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          label: 'Loại',
          required: true,
          defaultValue: 'collection',
          admin: { width: '50%' },
          options: [
            { label: 'Theo mùa', value: 'season' },
            { label: 'Chùm tour', value: 'collection' },
            { label: 'Tour đoàn riêng', value: 'private' },
            { label: 'Theo vùng', value: 'region' },
          ],
        },
        {
          name: 'order',
          type: 'number',
          label: 'Thứ tự',
          defaultValue: 0,
          admin: { width: '50%', description: 'Số nhỏ hiện trước.' },
        },
      ],
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Ảnh đại diện' },
    { name: 'summary', type: 'textarea', label: 'Mô tả ngắn', localized: true },
    seoField,
    viSlugField('name'),
  ],
}
