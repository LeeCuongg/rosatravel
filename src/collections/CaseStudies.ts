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
 * Collection CaseStudies — CHUYẾN ĐÃ ĐI.
 *
 * KHÁC HẲN với Tours, và sự khác biệt đó là lý do nó tồn tại:
 *
 *   Tour           = sản phẩm đang bán. Có giá, có số ngày, có nút đặt chỗ.
 *                    Viết ở thì tương lai: "bạn sẽ đi qua...".
 *   Chuyến đã đi   = một chuyến CÓ THẬT đã tổ chức xong cho một nhóm khách cụ
 *                    thể, kể lại thành bài. Không có giá, không đặt được.
 *                    Viết ở thì quá khứ: "nhóm đã dừng ở...".
 *
 * Nó bán hàng theo cách mà trang tour không làm được: trang tour là lời hứa,
 * còn đây là bằng chứng. Đó là lý do spotstravel.co đặt bốn chuyến đã đi ngay
 * dưới phần giới thiệu, trước cả danh sách sản phẩm.
 *
 * Đừng gộp hai loại này lại. Ai đó sẽ đề xuất thêm trường `priceFrom` vào đây
 * để "dùng luôn làm tour" — làm thế là mất cả hai: bài mất tính xác thực vì
 * đang chào bán, còn tour thì mang một mức giá đã cũ của một chuyến năm ngoái.
 */

/**
 * Màu nhấn riêng của từng bài.
 *
 * Lấy từ spotstravel.co: mỗi case study đặt `--cr-primary` riêng (NYC xanh
 * dương, Ý đỏ, Paris tím, Thuỵ Sĩ xanh lá). Tác dụng thật chứ không phải trang
 * trí: bốn bài viết cùng bố cục, cùng kiểu chữ, cùng nền kem sẽ trộn lẫn vào
 * nhau trong trí nhớ người đọc. Màu là thứ duy nhất phân biệt được chúng khi
 * lướt nhanh.
 *
 * MỌI giá trị dưới đây đã đo tương phản trên nền kem #fdf8ec và đều vượt 4.5:1
 * — chúng được dùng làm MÀU CHỮ cho tiêu đề trong bài, không chỉ làm viền.
 * Thêm màu mới thì phải đo lại, đừng chọn bằng mắt.
 */
export const MAU_NHAN = [
  { label: 'Đất nung (mặc định)', value: 'dat-nung' },
  { label: 'Xanh rêu', value: 'xanh-reu' },
  { label: 'Chì lam', value: 'chi-lam' },
  { label: 'Tím mận', value: 'tim-man' },
  { label: 'Vàng đất', value: 'vang-dat' },
] as const

const hooks = taoRevalidateHooks()

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: {
    singular: 'Chuyến đã đi',
    plural: 'Chuyến đã đi',
  },
  admin: {
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'slug', 'accent'],
    description:
      'Những chuyến đã tổ chức xong, kể lại theo ngày. Đây là phần chứng minh năng lực — không phải sản phẩm đang bán.',
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
      name: 'title',
      type: 'group',
      label: 'Tên chuyến đi',
      admin: { description: 'Ngắn, thường là tên nơi đến. Ví dụ: "Hà Giang cho một nhóm 9 người".' },
      fields: [viTextGroup('Tiếng Việt')],
    },
    displayTitleField('title', 'Tên chuyến đi'),
    {
      name: 'subtitle',
      type: 'group',
      label: 'Phụ đề',
      admin: { description: 'Một dòng in nghiêng dưới tên. Ví dụ: "Sáu ngày cuối tháng Mười".' },
      fields: [viTextGroup('Tiếng Việt')],
    },
    {
      name: 'accent',
      type: 'select',
      label: 'Màu nhấn',
      required: true,
      defaultValue: 'dat-nung',
      options: [...MAU_NHAN],
      admin: {
        description:
          'Màu riêng của bài này. Chọn khác nhau cho từng chuyến để bốn bài không trông giống hệt nhau.',
      },
    },
    {
      name: 'heroImage',
      type: 'relationship',
      relationTo: 'media',
      label: 'Ảnh đầu bài',
      required: true,
    },
    {
      name: 'thumbnail',
      type: 'relationship',
      relationTo: 'media',
      label: 'Ảnh trên thẻ ở trang chủ',
      required: false,
      admin: {
        description:
          'Ảnh này bị cắt thành hình TRÒN nên chủ thể phải nằm giữa khung. Bỏ trống thì dùng Ảnh đầu bài — ảnh ngang cắt tròn thường mất hai đầu, nên tốt nhất là chọn riêng một ảnh dọc.',
      },
    },
    doanVanArray('highlights', 'Điểm nhấn chuyến đi'),
    {
      name: 'ourRole',
      type: 'array',
      label: 'Rosa đã lo những gì',
      required: true,
      minRows: 1,
      admin: { description: 'Mỗi dòng là một việc. Viết ngắn, ở thì quá khứ.' },
      fields: [viTextGroup('Tiếng Việt')],
    },
    {
      name: 'days',
      type: 'array',
      label: 'Kể theo ngày',
      required: true,
      minRows: 1,
      admin: {
        description:
          'Số thứ tự ngày tự sinh theo vị trí trong danh sách — kéo thả để sắp lại, không cần đánh số.',
      },
      fields: [
        {
          name: 'title',
          type: 'group',
          label: 'Tiêu đề ngày',
          admin: { description: 'Không cần ghi "Ngày 1" — phần đó tự thêm.' },
          fields: [viTextGroup('Tiếng Việt')],
        },
        doanVanArray('body', 'Nội dung ngày'),
        {
          name: 'images',
          type: 'relationship',
          relationTo: 'media',
          label: 'Ảnh của ngày',
          hasMany: true,
          required: false,
          admin: {
            description:
              'Chọn 2 ảnh thì chúng xếp thành hai cột; 1 hoặc 3 ảnh cũng hiển thị được. Nhiều hơn 3 sẽ bị cắt bớt.',
          },
        },
        {
          name: 'locationsLabel',
          type: 'group',
          label: 'Tiêu đề khối địa điểm',
          admin: {
            description:
              'Ví dụ: "Ăn ở đâu", "Ngủ ở đâu", "Những nơi đã ghé". Bỏ trống thì dùng nhãn mặc định.',
          },
          fields: [viTextGroup('Tiếng Việt', false)],
        },
        {
          name: 'locations',
          type: 'relationship',
          relationTo: 'locations',
          label: 'Địa điểm nhắc tới trong ngày',
          hasMany: true,
          required: false,
        },
      ],
    },
    seoGroup(),
  ],
}
