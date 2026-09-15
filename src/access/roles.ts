import type { Access, FieldAccess } from 'payload'

export const ROLES = ['admin', 'editor', 'sales'] as const
export type Role = (typeof ROLES)[number]

type MaybeUser = { role?: Role | null } | null | undefined

export function hasRole(user: MaybeUser, ...roles: Role[]): boolean {
  return Boolean(user?.role && roles.includes(user.role))
}

export const anyone: Access = () => true
export const nobody: Access = () => false
export const loggedIn: Access = ({ req }) => Boolean(req.user)

/** Toàn quyền. */
export const adminOnly: Access = ({ req }) => hasRole(req.user, 'admin')

/** Sửa nội dung site: tour, bài viết, banner, cấu hình hiển thị. */
export const contentEditors: Access = ({ req }) => hasRole(req.user, 'admin', 'editor')

/** Xử lý yêu cầu đặt tour. */
export const salesTeam: Access = ({ req }) => hasRole(req.user, 'admin', 'sales')

/**
 * Khách (và API công khai) chỉ đọc được bản đã xuất bản; người sửa nội dung đọc
 * được cả bản nháp. Không có ràng buộc này thì `?draft=true` sẽ lộ bản nháp.
 */
export const publishedOrEditor: Access = ({ req }) =>
  hasRole(req.user, 'admin', 'editor') ? true : { _status: { equals: 'published' } }

export const adminFieldOnly: FieldAccess = ({ req }) => hasRole(req.user, 'admin')
