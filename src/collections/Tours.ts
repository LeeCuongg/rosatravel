import type { CollectionConfig, NumberFieldSingleValidation } from 'payload'

import { contentEditors, publishedOrEditor } from '../access/roles'
import { tourBlocks } from '../blocks/content'
import { seoField } from '../fields/common'
import { viSlugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'
import { tags } from '../lib/cache-tags'
import { previewPath, previewUrl } from '../lib/preview'
import { departureMonthsOf } from '../lib/tour-filters'

const positive: NumberFieldSingleValidation = (value) =>
  (typeof value === 'number' && value > 0) || 'Phải là số lớn hơn 0'

const optionalPositive: NumberFieldSingleValidation = (value) =>
  value === null || value === undefined || value > 0 || 'Phải là số lớn hơn 0'

const originalAbovePrice: NumberFieldSingleValidation = (value, { siblingData }) => {
  if (value === null || value === undefined) return true
  const price = (siblingData as { price?: number | null }).price
  return typeof price !== 'number' || value > price || 'Giá gốc phải lớn hơn giá bán (hoặc để trống)'
}

const revalidate = revalidateCollection<{ slug?: string | null }>((doc) => [
  tags.tours,
  doc.slug ? tags.tour(doc.slug) : '',
])

export const Tours: CollectionConfig = {
  slug: 'tours',
  labels: { singular: 'Tour', plural: 'Tour' },
  admin: {
    group: 'Tour',
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'durationDays', '_status', 'updatedAt'],
    description:
      'Bấm "Xuất bản" để đưa lên site. Khi đang sửa, bản nháp tự lưu và khách chưa thấy cho tới lúc xuất bản.',
    livePreview: {
      url: ({ data, locale }) => previewUrl(previewPath({ collection: 'tours', slug: data?.slug }, locale?.code)),
    },
    preview: (data, { locale }) =>
      previewUrl(previewPath({ collection: 'tours', slug: data?.slug as string | undefined }, locale)),
  },
  access: {
    read: publishedOrEditor,
    create: contentEditors,
    update: contentEditors,
    delete: contentEditors,
  },
  versions: {
    maxPerDoc: 30,
    drafts: { autosave: { interval: 2000 } },
  },
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thông tin chung',
          fields: [
            { name: 'title', type: 'text', label: 'Tên tour', required: true, localized: true },
            {
              name: 'summary',
              type: 'textarea',
              label: 'Mô tả ngắn',
              localized: true,
              admin: { description: 'Hiện dưới tên tour và trên kết quả Google (1–2 câu).' },
            },
            { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Ảnh bìa', required: true },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Bộ ảnh',
              admin: { description: 'Kéo thả để sắp xếp. Ảnh đầu tiên hiện lớn nhất.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'durationDays', type: 'number', label: 'Số ngày', required: true, min: 1, admin: { width: '25%' } },
                { name: 'durationNights', type: 'number', label: 'Số đêm', required: true, min: 0, admin: { width: '25%' } },
                {
                  name: 'departureFrom',
                  type: 'text',
                  label: 'Điểm khởi hành',
                  required: true,
                  localized: true,
                  admin: { width: '50%', placeholder: 'Hà Nội' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'destinations',
                  type: 'relationship',
                  relationTo: 'destinations',
                  hasMany: true,
                  label: 'Điểm đến',
                  admin: { width: '50%' },
                },
                {
                  name: 'categories',
                  type: 'relationship',
                  relationTo: 'tour-categories',
                  hasMany: true,
                  label: 'Danh mục',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'badges',
              type: 'array',
              label: 'Nhãn trên thẻ tour',
              maxRows: 3,
              labels: { singular: 'Nhãn', plural: 'Nhãn' },
              admin: { description: 'Ví dụ: HOT, Còn 5 chỗ. Tối đa 3 nhãn.' },
              fields: [{ name: 'text', type: 'text', label: 'Nhãn', required: true, localized: true, maxLength: 24 }],
            },
          ],
        },
        {
          label: 'Giá & lịch khởi hành',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  label: 'Giá bán từ (VND)',
                  required: true,
                  validate: positive,
                  admin: { width: '50%', step: 1000 },
                },
                {
                  name: 'originalPrice',
                  type: 'number',
                  label: 'Giá gốc (VND)',
                  validate: originalAbovePrice,
                  admin: { width: '50%', step: 1000, description: 'Để trống nếu không giảm giá.' },
                },
              ],
            },
            {
              name: 'departures',
              type: 'array',
              label: 'Lịch khởi hành',
              labels: { singular: 'Ngày khởi hành', plural: 'Ngày khởi hành' },
              admin: { description: 'Ngày đã qua tự ẩn trên site.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'date',
                      type: 'date',
                      label: 'Ngày khởi hành',
                      required: true,
                      admin: {
                        width: '25%',
                        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
                      },
                    },
                    {
                      name: 'price',
                      type: 'number',
                      label: 'Giá ngày này (VND)',
                      validate: optionalPositive,
                      admin: { width: '25%', step: 1000, description: 'Trống = giá bán chung' },
                    },
                    { name: 'seatsLeft', type: 'number', label: 'Số chỗ còn', min: 0, admin: { width: '20%' } },
                    {
                      name: 'status',
                      type: 'select',
                      label: 'Trạng thái',
                      required: true,
                      defaultValue: 'available',
                      admin: { width: '30%' },
                      options: [
                        { label: 'Còn chỗ', value: 'available' },
                        { label: 'Sắp hết chỗ', value: 'limited' },
                        { label: 'Hết chỗ', value: 'soldout' },
                        { label: 'Tạm hoãn', value: 'cancelled' },
                      ],
                    },
                  ],
                },
                { name: 'note', type: 'text', label: 'Ghi chú', localized: true },
              ],
            },
          ],
        },
        {
          label: 'Nội dung trang tour',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              label: 'Các khối nội dung',
              blocks: tourBlocks,
              labels: { singular: 'Khối', plural: 'Khối' },
              admin: {
                description: 'Bấm "Thêm: Khối" để thêm phần mới; kéo thả để đổi thứ tự hiển thị trên trang.',
                initCollapsed: true,
              },
            },
          ],
        },
        {
          label: 'Hiển thị & SEO',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'isFeatured', type: 'checkbox', label: 'Tour nổi bật' },
                { name: 'isTrending', type: 'checkbox', label: 'Đang xu hướng' },
              ],
            },
            {
              name: 'stats',
              type: 'group',
              label: 'Chỉ số trên thẻ tour',
              admin: { description: 'Để trống thì không hiện.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'ratingAverage',
                      type: 'number',
                      label: 'Điểm đánh giá (1–5)',
                      min: 1,
                      max: 5,
                      admin: { width: '33%', step: 0.1 },
                    },
                    { name: 'ratingCount', type: 'number', label: 'Số lượt đánh giá', min: 0, admin: { width: '33%' } },
                    { name: 'bookedCount', type: 'number', label: 'Số khách đã đặt', min: 0, admin: { width: '34%' } },
                  ],
                },
              ],
            },
            {
              name: 'relatedTours',
              type: 'relationship',
              relationTo: 'tours',
              hasMany: true,
              label: 'Tour liên quan',
              maxRows: 8,
              filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
              admin: { description: 'Để trống thì tự gợi ý tour cùng điểm đến.' },
            },
            seoField,
          ],
        },
      ],
    },
    {
      // Tự tính từ "Lịch khởi hành" mỗi lần lưu, dùng cho bộ lọc "tháng khởi hành" trên site.
      name: 'departureMonths',
      type: 'text',
      hasMany: true,
      index: true,
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ siblingData }) =>
            departureMonthsOf((siblingData as { departures?: { date?: string | null }[] | null }).departures),
        ],
      },
    },
    viSlugField('title'),
  ],
}
