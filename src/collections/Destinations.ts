import type { CollectionConfig } from 'payload'

import { contentEditors, publishedOrEditor } from '../access/roles'
import { seoField } from '../fields/common'
import { viSlugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { tags } from '../lib/cache-tags'
import { previewPath, previewUrl } from '../lib/preview'

const revalidate = revalidateCollection<{ slug?: string | null }>((doc) => [
  tags.destinations,
  doc.slug ? tags.destination(doc.slug) : '',
])

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  labels: { singular: 'Điểm đến', plural: 'Điểm đến' },
  admin: {
    group: 'Tour',
    useAsTitle: 'name',
    defaultColumns: ['name', 'region', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data, locale }) =>
        previewUrl(previewPath({ collection: 'destinations', slug: data?.slug }, locale?.code)),
    },
  },
  access: {
    read: publishedOrEditor,
    create: contentEditors,
    update: contentEditors,
    delete: contentEditors,
  },
  versions: { maxPerDoc: 20, drafts: { autosave: { interval: 2000 } } },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: 'name', type: 'text', label: 'Tên điểm đến', required: true, localized: true },
    {
      name: 'region',
      type: 'select',
      label: 'Vùng',
      required: true,
      options: [
        { label: 'Miền Bắc', value: 'north' },
        { label: 'Miền Trung', value: 'central' },
        { label: 'Miền Nam', value: 'south' },
        { label: 'Châu Á', value: 'asia' },
        { label: 'Châu Âu', value: 'europe' },
        { label: 'Châu Mỹ', value: 'americas' },
        { label: 'Châu Úc', value: 'oceania' },
        { label: 'Châu Phi', value: 'africa' },
      ],
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Ảnh đại diện', required: true },
    { name: 'summary', type: 'textarea', label: 'Mô tả ngắn', localized: true },
    { name: 'description', type: 'richText', label: 'Giới thiệu chi tiết', localized: true },
    seoField,
    viSlugField('name'),
  ],
}
