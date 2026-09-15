import type { CollectionConfig } from 'payload'

import { contentEditors, publishedOrEditor } from '../access/roles'
import { pageBlocks } from '../blocks/home'
import { seoField } from '../fields/common'
import { viSlugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { tags } from '../lib/cache-tags'
import { previewPath, previewUrl } from '../lib/preview'

const revalidate = revalidateCollection<{ slug?: string | null }>((doc) => [
  tags.pages,
  doc.slug ? tags.page(doc.slug) : '',
])

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Trang', plural: 'Trang tĩnh' },
  admin: {
    group: 'Nội dung',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description: 'Trang giới thiệu, chính sách, điều khoản… Tạo trang mới không cần dev.',
    livePreview: {
      url: ({ data, locale }) => previewUrl(previewPath({ collection: 'pages', slug: data?.slug }, locale?.code)),
    },
    preview: (data, { locale }) =>
      previewUrl(previewPath({ collection: 'pages', slug: data?.slug as string | undefined }, locale)),
  },
  access: { read: publishedOrEditor, create: contentEditors, update: contentEditors, delete: contentEditors },
  versions: { maxPerDoc: 20, drafts: { autosave: { interval: 2000 } } },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề trang', required: true, localized: true },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Các khối nội dung',
      blocks: pageBlocks,
      labels: { singular: 'Khối', plural: 'Khối' },
      admin: { description: 'Kéo thả để đổi thứ tự.', initCollapsed: true },
    },
    seoField,
    viSlugField('title'),
  ],
}
