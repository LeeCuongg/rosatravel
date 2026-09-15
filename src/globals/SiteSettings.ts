import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { anyone, contentEditors } from '../access/roles'
import { validateHref, validateUrl } from '../fields/common'
import { revalidateGlobal } from '../hooks/revalidate'

const validatePhone: TextFieldSingleValidation = (value) =>
  !value || /^[+\d][\d\s.-]{7,19}$/.test(value) || 'Số điện thoại chưa đúng, vd. 0973 122 807'

const validateZalo: TextFieldSingleValidation = (value) =>
  !value || /^https?:\/\//.test(value) || /^[+\d][\d\s.-]{7,19}$/.test(value) || 'Nhập số điện thoại hoặc link Zalo OA (https://…)'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Cài đặt chung',
  admin: {
    group: 'Cấu hình site',
    description: 'Hotline, email, mạng xã hội, thông tin công ty. Đổi ở đây là cả site cập nhật.',
  },
  access: { read: anyone, update: contentEditors },
  hooks: { afterChange: [revalidateGlobal('site-settings')] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Liên hệ',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'hotline',
                  type: 'text',
                  label: 'Hotline',
                  validate: validatePhone,
                  admin: { width: '50%', description: 'Hiện trên header, nút Gọi và footer.' },
                },
                { name: 'email', type: 'email', label: 'Email liên hệ', admin: { width: '50%' } },
              ],
            },
            { name: 'address', type: 'textarea', label: 'Địa chỉ văn phòng', localized: true },
          ],
        },
        {
          label: 'Kênh liên hệ',
          description: 'Kênh nào để trống sẽ tự ẩn khỏi site.',
          fields: [
            {
              name: 'zalo',
              type: 'text',
              label: 'Zalo',
              validate: validateZalo,
              admin: { description: 'Số điện thoại (vd. 0973122807) hoặc link Zalo OA.' },
            },
            {
              name: 'messenger',
              type: 'text',
              label: 'Messenger',
              validate: validateUrl,
              admin: { placeholder: 'https://m.me/ten-trang' },
            },
            {
              name: 'facebook',
              type: 'text',
              label: 'Facebook',
              validate: validateUrl,
              admin: { placeholder: 'https://www.facebook.com/ten-trang' },
            },
            {
              name: 'instagram',
              type: 'text',
              label: 'Instagram',
              validate: validateUrl,
              admin: { placeholder: 'https://www.instagram.com/ten-tai-khoan' },
            },
            {
              name: 'threads',
              type: 'text',
              label: 'Threads',
              validate: validateUrl,
              admin: { placeholder: 'https://www.threads.net/@ten-tai-khoan' },
            },
          ],
        },
        {
          label: 'Đặt tour',
          fields: [
            {
              name: 'bookingPath',
              type: 'text',
              label: 'Trang của nút "Đặt tour"',
              required: true,
              defaultValue: '/lien-he',
              validate: validateHref,
            },
            {
              name: 'bookingNotifyEmails',
              type: 'array',
              label: 'Email nhận thông báo yêu cầu đặt tour',
              labels: { singular: 'Email', plural: 'Email' },
              admin: { description: 'Mỗi yêu cầu mới sẽ gửi email tới các địa chỉ này.' },
              fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
            },
            {
              name: 'bookingSuccessMessage',
              type: 'textarea',
              label: 'Lời cảm ơn sau khi khách gửi yêu cầu',
              localized: true,
              admin: {
                description:
                  'Để trống sẽ dùng: "Cảm ơn bạn! Nhân viên Rosa Travel sẽ liên hệ trong giờ làm việc. Cần gấp, hãy gọi hotline."',
              },
            },
          ],
        },
        {
          label: 'Công ty',
          fields: [
            { name: 'companyName', type: 'text', label: 'Tên công ty', localized: true },
            { name: 'about', type: 'textarea', label: 'Giới thiệu ngắn (footer)', localized: true },
            {
              name: 'legalLines',
              type: 'array',
              label: 'Thông tin pháp lý',
              labels: { singular: 'Dòng', plural: 'Dòng' },
              admin: { description: 'Giấy phép kinh doanh, giấy phép lữ hành…' },
              fields: [{ name: 'text', type: 'text', label: 'Nội dung', required: true, localized: true }],
            },
            { name: 'copyright', type: 'text', label: 'Dòng bản quyền', localized: true },
          ],
        },
      ],
    },
  ],
}
