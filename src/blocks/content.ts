import type { Block } from 'payload'

import { titleField, validateUrl } from '../fields/common'

/*
 * Khối nội dung dùng cho trang tour và trang tĩnh. Nhân viên thêm/xóa/kéo thả
 * thứ tự trong admin (nguyên tắc số 1, docs/ke-hoach-trien-khai.md mục 0.2).
 * Thêm một loại khối mới = thêm ở đây + component hiển thị tương ứng.
 */

export const HighlightsBlock: Block = {
  slug: 'highlights',
  interfaceName: 'HighlightsBlock',
  labels: { singular: 'Điểm nổi bật', plural: 'Điểm nổi bật' },
  fields: [
    titleField(),
    {
      name: 'items',
      type: 'array',
      label: 'Các điểm nổi bật',
      minRows: 1,
      labels: { singular: 'Điểm', plural: 'Điểm' },
      fields: [{ name: 'text', type: 'text', label: 'Nội dung', required: true, localized: true }],
    },
  ],
}

export const ItineraryBlock: Block = {
  slug: 'itinerary',
  interfaceName: 'ItineraryBlock',
  labels: { singular: 'Lịch trình', plural: 'Lịch trình' },
  fields: [
    titleField(),
    {
      name: 'days',
      type: 'array',
      label: 'Các ngày',
      minRows: 1,
      labels: { singular: 'Ngày', plural: 'Ngày' },
      admin: { description: 'Kéo thả để đổi thứ tự. Mục đầu tiên là Ngày 1.' },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Tiêu đề ngày',
          required: true,
          localized: true,
          admin: { placeholder: 'Hà Nội – Hà Giang' },
        },
        {
          name: 'meals',
          type: 'select',
          hasMany: true,
          label: 'Bữa ăn',
          options: [
            { label: 'Sáng', value: 'breakfast' },
            { label: 'Trưa', value: 'lunch' },
            { label: 'Tối', value: 'dinner' },
          ],
        },
        { name: 'content', type: 'richText', label: 'Hoạt động trong ngày', required: true, localized: true },
        { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, label: 'Ảnh trong ngày' },
      ],
    },
  ],
}

export const InclusionsBlock: Block = {
  slug: 'inclusions',
  interfaceName: 'InclusionsBlock',
  labels: { singular: 'Bao gồm / Không bao gồm', plural: 'Bao gồm / Không bao gồm' },
  fields: [
    titleField(),
    {
      type: 'row',
      fields: [
        {
          name: 'included',
          type: 'array',
          label: 'Giá tour bao gồm',
          labels: { singular: 'Mục', plural: 'Mục' },
          admin: { width: '50%' },
          fields: [{ name: 'text', type: 'text', label: 'Nội dung', required: true, localized: true }],
        },
        {
          name: 'excluded',
          type: 'array',
          label: 'Không bao gồm',
          labels: { singular: 'Mục', plural: 'Mục' },
          admin: { width: '50%' },
          fields: [{ name: 'text', type: 'text', label: 'Nội dung', required: true, localized: true }],
        },
      ],
    },
  ],
}

export const PriceTableBlock: Block = {
  slug: 'priceTable',
  interfaceName: 'PriceTableBlock',
  labels: { singular: 'Bảng giá', plural: 'Bảng giá' },
  fields: [
    titleField(),
    {
      name: 'rows',
      type: 'array',
      label: 'Các dòng giá',
      minRows: 1,
      labels: { singular: 'Dòng', plural: 'Dòng' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Đối tượng / hạng mục',
              required: true,
              localized: true,
              admin: { width: '40%', placeholder: 'Trẻ em 5–10 tuổi' },
            },
            { name: 'price', type: 'number', label: 'Giá (VND)', min: 0, admin: { width: '25%' } },
            { name: 'note', type: 'text', label: 'Ghi chú', localized: true, admin: { width: '35%' } },
          ],
        },
      ],
    },
    { name: 'footnote', type: 'richText', label: 'Ghi chú dưới bảng', localized: true },
  ],
}

export const PolicyBlock: Block = {
  slug: 'policy',
  interfaceName: 'PolicyBlock',
  labels: { singular: 'Chính sách', plural: 'Chính sách' },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Tiêu đề',
      required: true,
      localized: true,
      admin: { placeholder: 'Chính sách hủy tour' },
    },
    { name: 'content', type: 'richText', label: 'Nội dung', required: true, localized: true },
  ],
}

export const NotesBlock: Block = {
  slug: 'notes',
  interfaceName: 'NotesBlock',
  labels: { singular: 'Lưu ý', plural: 'Lưu ý' },
  fields: [titleField(), { name: 'content', type: 'richText', label: 'Nội dung', required: true, localized: true }],
}

export const FaqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: { singular: 'Câu hỏi thường gặp', plural: 'Câu hỏi thường gặp' },
  fields: [
    titleField(),
    {
      name: 'items',
      type: 'array',
      label: 'Câu hỏi',
      minRows: 1,
      labels: { singular: 'Câu hỏi', plural: 'Câu hỏi' },
      fields: [
        { name: 'question', type: 'text', label: 'Câu hỏi', required: true, localized: true },
        { name: 'answer', type: 'richText', label: 'Trả lời', required: true, localized: true },
      ],
    },
  ],
}

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Bộ ảnh', plural: 'Bộ ảnh' },
  fields: [
    titleField(),
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, required: true, label: 'Ảnh' },
  ],
}

export const VideoBlock: Block = {
  slug: 'video',
  interfaceName: 'VideoBlock',
  labels: { singular: 'Video', plural: 'Video' },
  fields: [
    titleField(),
    {
      name: 'url',
      type: 'text',
      label: 'Link video YouTube',
      required: true,
      validate: validateUrl,
      admin: { placeholder: 'https://www.youtube.com/watch?v=…' },
    },
    { name: 'caption', type: 'text', label: 'Chú thích', localized: true },
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Văn bản tự do', plural: 'Văn bản tự do' },
  fields: [{ name: 'content', type: 'richText', label: 'Nội dung', required: true, localized: true }],
}

export const tourBlocks: Block[] = [
  HighlightsBlock,
  ItineraryBlock,
  InclusionsBlock,
  PriceTableBlock,
  PolicyBlock,
  NotesBlock,
  FaqBlock,
  GalleryBlock,
  VideoBlock,
  RichTextBlock,
]
