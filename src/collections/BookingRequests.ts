import type { CollectionConfig } from 'payload'

import { adminOnly, nobody, salesTeam } from '../access/roles'

const readOnly = { readOnly: true }

export const BookingRequests: CollectionConfig = {
  slug: 'booking-requests',
  labels: { singular: 'Yêu cầu đặt tour', plural: 'Yêu cầu đặt tour' },
  admin: {
    group: 'Khách hàng',
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'phone', 'type', 'tour', 'status', 'createdAt'],
    listSearchableFields: ['fullName', 'phone', 'email'],
    description: 'Yêu cầu khách gửi từ website. Đổi trạng thái sau khi đã liên hệ khách.',
  },
  defaultSort: '-createdAt',
  access: {
    read: salesTeam,
    update: salesTeam,
    delete: adminOnly,
    // Không mở API tạo công khai: form trên site gửi qua Server Action (giai đoạn 4),
    // có kiểm tra dữ liệu + chống spam rồi mới ghi bằng Local API.
    create: nobody,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          label: 'Trạng thái',
          required: true,
          defaultValue: 'new',
          admin: { width: '50%' },
          options: [
            { label: 'Mới', value: 'new' },
            { label: 'Đã liên hệ', value: 'contacted' },
            { label: 'Đã chốt', value: 'won' },
            { label: 'Hủy', value: 'cancelled' },
          ],
        },
        {
          name: 'type',
          type: 'select',
          label: 'Loại yêu cầu',
          required: true,
          defaultValue: 'booking',
          admin: { width: '50%' },
          options: [
            { label: 'Đặt tour', value: 'booking' },
            { label: 'Tư vấn', value: 'consultation' },
            { label: 'Nhận ưu đãi', value: 'newsletter' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'fullName', type: 'text', label: 'Họ tên', required: true, admin: { width: '34%' } },
        { name: 'phone', type: 'text', label: 'Số điện thoại', required: true, admin: { width: '33%' } },
        { name: 'email', type: 'email', label: 'Email', admin: { width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'tour', type: 'relationship', relationTo: 'tours', label: 'Tour', admin: { width: '50%' } },
        {
          name: 'departureDate',
          type: 'date',
          label: 'Ngày khởi hành mong muốn',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'adults', type: 'number', label: 'Người lớn', min: 0, admin: { width: '50%' } },
        { name: 'children', type: 'number', label: 'Trẻ em', min: 0, admin: { width: '50%' } },
      ],
    },
    { name: 'message', type: 'textarea', label: 'Lời nhắn của khách' },
    {
      name: 'assignee',
      type: 'relationship',
      relationTo: 'users',
      label: 'Người phụ trách',
      admin: { position: 'sidebar' },
    },
    {
      name: 'internalNote',
      type: 'textarea',
      label: 'Ghi chú nội bộ',
      admin: { position: 'sidebar', description: 'Khách không nhìn thấy.' },
    },
    {
      name: 'source',
      type: 'group',
      label: 'Nguồn',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'page', type: 'text', label: 'Trang gửi', admin: readOnly },
        { name: 'locale', type: 'text', label: 'Ngôn ngữ', admin: readOnly },
        { name: 'utmSource', type: 'text', label: 'utm_source', admin: readOnly },
        { name: 'utmMedium', type: 'text', label: 'utm_medium', admin: readOnly },
        { name: 'utmCampaign', type: 'text', label: 'utm_campaign', admin: readOnly },
      ],
    },
  ],
}
