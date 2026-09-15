import type { Access, CollectionConfig } from 'payload'

import { contentEditors, hasRole } from '../access/roles'
import { revalidateCollection } from '../hooks/revalidate'
import { tags } from '../lib/cache-tags'

// Khách chỉ thấy đánh giá đã duyệt.
const approvedOrEditor: Access = ({ req }) =>
  hasRole(req.user, 'admin', 'editor') ? true : { approved: { equals: true } }

const revalidate = revalidateCollection(() => [tags.reviews])

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Đánh giá khách hàng', plural: 'Đánh giá khách hàng' },
  admin: {
    group: 'Nội dung',
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'tour', 'rating', 'approved', 'updatedAt'],
  },
  access: { read: approvedOrEditor, create: contentEditors, update: contentEditors, delete: contentEditors },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    {
      name: 'approved',
      type: 'checkbox',
      label: 'Hiện trên site',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Chỉ đánh giá được đánh dấu mới hiện cho khách.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'customerName', type: 'text', label: 'Tên khách', required: true, admin: { width: '50%' } },
        { name: 'location', type: 'text', label: 'Nơi ở / đơn vị', localized: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'tour', type: 'relationship', relationTo: 'tours', label: 'Tour đã đi', admin: { width: '70%' } },
        {
          name: 'rating',
          type: 'number',
          label: 'Số sao',
          required: true,
          defaultValue: 5,
          min: 1,
          max: 5,
          admin: { width: '30%' },
        },
      ],
    },
    { name: 'avatar', type: 'upload', relationTo: 'media', label: 'Ảnh đại diện' },
    { name: 'quote', type: 'textarea', label: 'Trích dẫn ngắn', required: true, localized: true, maxLength: 300 },
    { name: 'content', type: 'richText', label: 'Nội dung đầy đủ', localized: true },
  ],
}
