import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { adminFieldOnly, adminOnly, hasRole, loggedIn } from '../access/roles'

// Quyền vào trang admin phải trả về đúng/sai (không nhận điều kiện lọc như `Access`).
const canAccessAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

// Người dùng đầu tiên (tạo ở /admin/create-first-user) luôn là quản trị.
// Dùng `find` thay vì `count`: tạo user chạy trong transaction, mà MongoDB không
// cho phép lệnh `count` trong transaction (lỗi OperationNotSupportedInTransaction).
const firstUserIsAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create') {
    const existing = await req.payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      req,
    })
    if (existing.docs.length === 0) {
      return { ...data, role: 'admin' }
    }
  }
  return data
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Người dùng', plural: 'Người dùng' },
  admin: {
    group: 'Hệ thống',
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
  },
  auth: true,
  access: {
    admin: canAccessAdmin,
    read: loggedIn,
    create: adminOnly,
    update: ({ req, id }) => hasRole(req.user, 'admin') || (req.user ? req.user.id === id : false),
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [firstUserIsAdmin],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Họ tên' },
    {
      name: 'role',
      type: 'select',
      label: 'Vai trò',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      access: { update: adminFieldOnly },
      options: [
        { label: 'Quản trị (toàn quyền)', value: 'admin' },
        { label: 'Biên tập nội dung', value: 'editor' },
        { label: 'Sales (xử lý yêu cầu đặt tour)', value: 'sales' },
      ],
      admin: {
        description: 'Chỉ quản trị đổi được vai trò. Người dùng đầu tiên tự động là quản trị.',
      },
    },
  ],
}
