import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { contentEditors, publishedOrEditor } from '../access/roles'
import { seoField } from '../fields/common'
import { viSlugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { tags } from '../lib/cache-tags'
import { previewPath, previewUrl } from '../lib/preview'

// Lần đầu xuất bản mà chưa chọn ngày đăng thì lấy thời điểm hiện tại.
const setPublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  if (data._status === 'published' && !data.publishedAt) {
    return { ...data, publishedAt: new Date().toISOString() }
  }
  return data
}

const revalidate = revalidateCollection<{ slug?: string | null }>((doc) => [
  tags.posts,
  doc.slug ? tags.post(doc.slug) : '',
])

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Bài viết', plural: 'Bài viết' },
  admin: {
    group: 'Nội dung',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', '_status', 'publishedAt'],
    livePreview: {
      url: ({ data, locale }) => previewUrl(previewPath({ collection: 'posts', slug: data?.slug }, locale?.code)),
    },
    preview: (data, { locale }) =>
      previewUrl(previewPath({ collection: 'posts', slug: data?.slug as string | undefined }, locale)),
  },
  defaultSort: '-publishedAt',
  access: { read: publishedOrEditor, create: contentEditors, update: contentEditors, delete: contentEditors },
  versions: { maxPerDoc: 20, drafts: { autosave: { interval: 2000 } } },
  hooks: {
    beforeChange: [setPublishedAt],
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề', required: true, localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          label: 'Chuyên mục',
          required: true,
          defaultValue: 'guide',
          admin: { width: '50%' },
          options: [
            { label: 'Cẩm nang du lịch', value: 'guide' },
            { label: 'Tin tức', value: 'news' },
            { label: 'Khuyến mãi', value: 'promotion' },
            { label: 'Báo chí nói về chúng tôi', value: 'press' },
          ],
        },
        {
          name: 'publishedAt',
          type: 'date',
          label: 'Ngày đăng',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
        },
      ],
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Ảnh bìa', required: true },
    { name: 'excerpt', type: 'textarea', label: 'Tóm tắt', localized: true, maxLength: 300 },
    { name: 'content', type: 'richText', label: 'Nội dung', required: true, localized: true },
    {
      name: 'sourceUrl',
      type: 'text',
      label: 'Link bài gốc (với bài báo chí)',
      admin: { condition: (_, siblingData) => siblingData?.category === 'press' },
    },
    seoField,
    viSlugField('title'),
  ],
}
