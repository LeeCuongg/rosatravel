import type { CollectionConfig, DateFieldValidation } from 'payload'

import { anyone, contentEditors } from '../access/roles'
import { validateHref } from '../fields/common'
import { revalidateCollection } from '../hooks/revalidate'
import { tags } from '../lib/cache-tags'

const endsAfterStart: DateFieldValidation = (value, { siblingData }) => {
  const startsAt = (siblingData as { startsAt?: string | null }).startsAt
  if (!value || !startsAt) return true
  return new Date(value) > new Date(startsAt) || '"Ẩn sau ngày" phải sau "Hiện từ ngày"'
}

const revalidate = revalidateCollection(() => [tags.banners])

export const Banners: CollectionConfig = {
  slug: 'banners',
  labels: { singular: 'Banner', plural: 'Banner' },
  admin: {
    group: 'Nội dung',
    useAsTitle: 'title',
    defaultColumns: ['title', 'placement', 'active', 'startsAt', 'endsAt'],
    description:
      'Banner đầu trang chủ và hàng khuyến mãi. Đặt "Hiện từ ngày" / "Ẩn sau ngày" để banner tự hiện và tự ẩn theo lịch.',
  },
  defaultSort: 'order',
  access: { read: anyone, create: contentEditors, update: contentEditors, delete: contentEditors },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Tên banner (nội bộ)',
      required: true,
      admin: { description: 'Chỉ để nhận biết trong admin, khách không thấy.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'placement',
          type: 'select',
          label: 'Vị trí',
          required: true,
          defaultValue: 'hero',
          admin: { width: '50%' },
          options: [
            { label: 'Đầu trang chủ (ảnh lớn)', value: 'hero' },
            { label: 'Hàng khuyến mãi', value: 'promo' },
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
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Ảnh (máy tính)', required: true },
    {
      name: 'mobileImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Ảnh (điện thoại)',
      admin: { description: 'Để trống thì dùng ảnh máy tính.' },
    },
    {
      name: 'href',
      type: 'text',
      label: 'Link khi bấm vào banner',
      validate: validateHref,
      admin: { description: 'Trang trong site: /danh-muc/tour-mua-thu · Trang ngoài: https://…' },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Đang bật',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'startsAt',
      type: 'date',
      label: 'Hiện từ ngày',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' } },
    },
    {
      name: 'endsAt',
      type: 'date',
      label: 'Ẩn sau ngày',
      validate: endsAfterStart,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' } },
    },
  ],
}
