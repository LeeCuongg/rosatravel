import type { Block } from 'payload'

import { titleField, viewAllField } from '../fields/common'
import { FaqBlock, GalleryBlock, HighlightsBlock, RichTextBlock, VideoBlock } from './content'

/* Khối section cho trang chủ và trang tĩnh. Nhân viên chọn khối nào hiện, theo thứ tự nào. */

export const HeroBannersBlock: Block = {
  slug: 'heroBanners',
  interfaceName: 'HeroBannersBlock',
  labels: { singular: 'Banner đầu trang', plural: 'Banner đầu trang' },
  admin: { disableBlockName: true },
  fields: [
    {
      name: 'showSearch',
      type: 'checkbox',
      label: 'Hiện ô tìm kiếm tour',
      defaultValue: true,
      admin: {
        description: 'Ảnh lấy từ mục Banner (vị trí "Đầu trang chủ") đang trong thời gian hiển thị.',
      },
    },
    {
      name: 'searchPlaceholder',
      type: 'text',
      label: 'Chữ gợi ý trong ô tìm kiếm',
      localized: true,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.showSearch),
        description: 'Để trống sẽ dùng: "Bạn muốn đi đâu? Ví dụ: Hồng Kông, Phú Quốc".',
      },
    },
  ],
}

export const UspBlock: Block = {
  slug: 'usp',
  interfaceName: 'UspBlock',
  labels: { singular: 'Cam kết / lý do chọn', plural: 'Cam kết / lý do chọn' },
  fields: [
    titleField(),
    {
      name: 'items',
      type: 'array',
      label: 'Các cam kết',
      minRows: 1,
      maxRows: 6,
      labels: { singular: 'Cam kết', plural: 'Cam kết' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'icon',
              type: 'select',
              label: 'Biểu tượng',
              required: true,
              defaultValue: 'support',
              admin: { width: '30%' },
              options: [
                { label: 'Hỗ trợ 24/7', value: 'support' },
                { label: 'Chất lượng', value: 'quality' },
                { label: 'Đa dạng hành trình', value: 'variety' },
                { label: 'Giá tốt', value: 'price' },
                { label: 'An toàn', value: 'safety' },
                { label: 'Kinh nghiệm', value: 'experience' },
              ],
            },
            { name: 'title', type: 'text', label: 'Tiêu đề', required: true, localized: true, admin: { width: '70%' } },
          ],
        },
        { name: 'description', type: 'text', label: 'Mô tả ngắn', localized: true },
      ],
    },
  ],
}

export const PromoBannersBlock: Block = {
  slug: 'promoBanners',
  interfaceName: 'PromoBannersBlock',
  labels: { singular: 'Hàng banner khuyến mãi', plural: 'Hàng banner khuyến mãi' },
  fields: [
    titleField('Tiêu đề section'),
    viewAllField(),
  ],
  admin: {
    disableBlockName: true,
  },
}

export const TourCarouselBlock: Block = {
  slug: 'tourCarousel',
  interfaceName: 'TourCarouselBlock',
  labels: { singular: 'Băng chuyền tour', plural: 'Băng chuyền tour' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Dòng nhỏ phía trên', localized: true },
    { name: 'title', type: 'text', label: 'Tiêu đề section', required: true, localized: true },
    { name: 'description', type: 'text', label: 'Mô tả', localized: true },
    {
      name: 'source',
      type: 'select',
      label: 'Lấy tour từ',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Chọn tay từng tour', value: 'manual' },
        { label: 'Một danh mục', value: 'category' },
        { label: 'Tour nổi bật', value: 'featured' },
        { label: 'Tour đang xu hướng', value: 'trending' },
      ],
    },
    {
      name: 'tours',
      type: 'relationship',
      relationTo: 'tours',
      hasMany: true,
      label: 'Tour',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
        description: 'Kéo thả để đổi thứ tự.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'tour-categories',
      label: 'Danh mục',
      admin: { condition: (_, siblingData) => siblingData?.source === 'category' },
    },
    {
      name: 'limit',
      type: 'number',
      label: 'Số tour tối đa',
      defaultValue: 8,
      min: 1,
      max: 20,
      admin: { condition: (_, siblingData) => siblingData?.source !== 'manual' },
    },
    viewAllField(),
  ],
}

export const CategoryTilesBlock: Block = {
  slug: 'categoryTiles',
  interfaceName: 'CategoryTilesBlock',
  labels: { singular: 'Ô danh mục', plural: 'Ô danh mục' },
  fields: [
    titleField('Tiêu đề section'),
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'tour-categories',
      hasMany: true,
      required: true,
      label: 'Danh mục',
    },
  ],
}

export const DestinationGridBlock: Block = {
  slug: 'destinationGrid',
  interfaceName: 'DestinationGridBlock',
  labels: { singular: 'Lưới điểm đến', plural: 'Lưới điểm đến' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Dòng nhỏ phía trên', localized: true },
    { name: 'title', type: 'text', label: 'Tiêu đề section', required: true, localized: true },
    {
      name: 'destinations',
      type: 'relationship',
      relationTo: 'destinations',
      hasMany: true,
      required: true,
      maxRows: 6,
      label: 'Điểm đến (tối đa 6)',
    },
    viewAllField(),
  ],
}

export const ReviewsBlock: Block = {
  slug: 'reviews',
  interfaceName: 'ReviewsBlock',
  labels: { singular: 'Đánh giá khách hàng', plural: 'Đánh giá khách hàng' },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề section', required: true, localized: true },
    { name: 'limit', type: 'number', label: 'Số đánh giá tối đa', defaultValue: 8, min: 1, max: 20 },
    viewAllField(),
  ],
}

export const ClientsBlock: Block = {
  slug: 'clients',
  interfaceName: 'ClientsBlock',
  labels: { singular: 'Logo khách hàng doanh nghiệp', plural: 'Logo khách hàng doanh nghiệp' },
  fields: [titleField('Tiêu đề section')],
}

export const PostsBlock: Block = {
  slug: 'posts',
  interfaceName: 'PostsBlock',
  labels: { singular: 'Bài viết', plural: 'Bài viết' },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề section', required: true, localized: true },
    {
      name: 'category',
      type: 'select',
      label: 'Chuyên mục',
      options: [
        { label: 'Cẩm nang du lịch', value: 'guide' },
        { label: 'Tin tức', value: 'news' },
        { label: 'Khuyến mãi', value: 'promotion' },
        { label: 'Báo chí nói về chúng tôi', value: 'press' },
      ],
      admin: { description: 'Để trống thì lấy bài mới nhất của mọi chuyên mục.' },
    },
    { name: 'limit', type: 'number', label: 'Số bài tối đa', defaultValue: 4, min: 1, max: 12 },
    viewAllField(),
  ],
}

export const NewsletterBlock: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  labels: { singular: 'Đăng ký nhận ưu đãi', plural: 'Đăng ký nhận ưu đãi' },
  fields: [
    { name: 'title', type: 'text', label: 'Tiêu đề', required: true, localized: true },
    { name: 'description', type: 'text', label: 'Mô tả', localized: true },
    {
      name: 'buttonLabel',
      type: 'text',
      label: 'Chữ trên nút',
      localized: true,
      admin: { placeholder: 'Đăng ký' },
    },
    {
      name: 'successMessage',
      type: 'textarea',
      label: 'Lời cảm ơn sau khi đăng ký',
      localized: true,
      admin: { description: 'Để trống sẽ dùng: "Đăng ký thành công! Rosa Travel sẽ gửi ưu đãi mới nhất cho bạn."' },
    },
  ],
}

export const homeBlocks: Block[] = [
  HeroBannersBlock,
  UspBlock,
  PromoBannersBlock,
  TourCarouselBlock,
  CategoryTilesBlock,
  DestinationGridBlock,
  ReviewsBlock,
  ClientsBlock,
  PostsBlock,
  NewsletterBlock,
  RichTextBlock,
]

export const pageBlocks: Block[] = [
  RichTextBlock,
  HighlightsBlock,
  FaqBlock,
  GalleryBlock,
  VideoBlock,
  TourCarouselBlock,
  NewsletterBlock,
]
