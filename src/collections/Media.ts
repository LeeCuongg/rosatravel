import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Ảnh', plural: 'Thư viện ảnh' },
  admin: {
    group: 'Nội dung',
    description: 'Ảnh cho tour, bài viết, banner. Nhớ điền mô tả ảnh: tốt cho SEO và người khiếm thị.',
  },
  access: {
    read: anyone,
    create: contentEditors,
    update: contentEditors,
    delete: contentEditors,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Mô tả ảnh (alt)',
      required: true,
      localized: true,
      admin: { description: 'Tả ngắn nội dung ảnh, vd. "Ruộng bậc thang Mù Cang Chải mùa lúa chín".' },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 480 },
      { name: 'card', width: 960 },
      { name: 'hero', width: 1920 },
    ],
  },
}
