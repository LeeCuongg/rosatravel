import type { CollectionConfig } from 'payload'

/**
 * Không có trường vai trò: spec GĐ2 mục 8 nói rõ giai đoạn này mọi người sửa
 * được mọi thứ — phân quyền cho ba người cùng công ty là phức tạp thừa.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  labels: {
    singular: 'Người dùng',
    plural: 'Người dùng',
  },
  fields: [],
}
