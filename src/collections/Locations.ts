import type { CollectionConfig } from 'payload'

import {
  displayTitleField,
  doanVanArray,
  seoGroup,
  taoRevalidateHooks,
  validateSlug,
  viTextGroup,
} from './fields'

/**
 * Collection Locations — ĐỊA ĐIỂM.
 *
 * Một quán ăn, một homestay, một khúc sông, một chợ phiên: thứ có tên riêng,
 * có chỗ đứng trên bản đồ, và tồn tại độc lập với bất kỳ chuyến đi nào.
 *
 * Vì sao là collection riêng chứ không nhúng thẳng vào bài viết: cùng một quán
 * xuất hiện ở nhiều tour và nhiều chuyến đã đi. Nhúng thì phải gõ lại tên, ảnh
 * và mô tả ở từng chỗ, và khi quán đóng cửa thì phải đi sửa từng chỗ một —
 * hoặc quên sửa, để lại một địa chỉ chết trên trang bán tour.
 *
 * Đây cũng là tài sản SEO dài hạn: mỗi địa điểm là một trang riêng
 * (/dia-diem/<slug>) có thể xếp hạng cho truy vấn tên riêng của nó, thứ mà
 * trang tour không bao giờ làm được.
 *
 * `category` là select một giá trị, không phải mảng thẻ tự do. Thẻ tự do luôn
 * phân rã: "ăn uống", "Ăn uống", "quán ăn", "am thuc" cùng tồn tại sau vài
 * tháng, và không lọc được nữa. Cần thêm loại thì thêm vào danh sách dưới đây.
 */

export const DANH_MUC_DIA_DIEM = [
  { label: 'Ăn uống', value: 'an-uong' },
  { label: 'Lưu trú', value: 'luu-tru' },
  { label: 'Thiên nhiên', value: 'thien-nhien' },
  { label: 'Văn hoá', value: 'van-hoa' },
  { label: 'Chợ và mua sắm', value: 'cho-mua-sam' },
] as const

const hooks = taoRevalidateHooks()

export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: {
    singular: 'Địa điểm',
    plural: 'Địa điểm',
  },
  admin: {
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'slug', 'category'],
    description:
      'Những nơi cụ thể được nhắc tới trong bài viết — quán ăn, homestay, chợ phiên. Mỗi địa điểm có trang riêng và dùng lại được ở nhiều tour.',
  },
  hooks: {
    afterChange: [hooks.afterChange],
    afterDelete: [hooks.afterDelete],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      label: 'Đường dẫn (chữ thường, không dấu)',
      required: true,
      unique: true,
      validate: validateSlug,
    },
    {
      name: 'name',
      type: 'group',
      label: 'Tên địa điểm',
      fields: [viTextGroup('Tiếng Việt')],
    },
    displayTitleField('name', 'Tên địa điểm'),
    {
      name: 'category',
      type: 'select',
      label: 'Loại',
      required: true,
      options: [...DANH_MUC_DIA_DIEM],
    },
    {
      name: 'excerpt',
      type: 'group',
      label: 'Mô tả ngắn',
      admin: {
        description:
          'Một hoặc hai câu, hiện trên THẺ địa điểm nhúng trong bài viết. Giữ ngắn — thẻ chỉ đủ chỗ cho khoảng hai dòng.',
      },
      fields: [viTextGroup('Tiếng Việt', 'textarea')],
    },
    doanVanArray('body', 'Bài viết'),
    {
      name: 'address',
      type: 'text',
      label: 'Địa chỉ',
      required: false,
    },
    {
      name: 'website',
      type: 'text',
      label: 'Website',
      required: false,
      admin: { description: 'URL đầy đủ, ví dụ: https://... — để trống nếu nơi này không có web.' },
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      label: 'Ảnh',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: { description: 'Ảnh đầu tiên được dùng làm ảnh trên thẻ.' },
    },
    seoGroup(),
  ],
}
