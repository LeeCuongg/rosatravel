import type { PayloadRequest } from 'payload'
import { describe, expect, it } from 'vitest'

import { contentEditors, hasRole, publishedOrEditor, salesTeam } from './roles'

function args(role?: 'admin' | 'editor' | 'sales') {
  return { req: { user: role ? { role } : null } as unknown as PayloadRequest }
}

describe('hasRole', () => {
  it('đúng khi user có một trong các vai trò', () => {
    expect(hasRole({ role: 'editor' }, 'admin', 'editor')).toBe(true)
    expect(hasRole({ role: 'sales' }, 'admin', 'editor')).toBe(false)
    expect(hasRole(null, 'admin')).toBe(false)
  })
})

describe('publishedOrEditor', () => {
  it('khách chỉ thấy bản đã xuất bản', () => {
    expect(publishedOrEditor(args())).toEqual({ _status: { equals: 'published' } })
    expect(publishedOrEditor(args('sales'))).toEqual({ _status: { equals: 'published' } })
  })

  it('admin và biên tập viên thấy cả bản nháp', () => {
    expect(publishedOrEditor(args('admin'))).toBe(true)
    expect(publishedOrEditor(args('editor'))).toBe(true)
  })
})

describe('phân quyền theo nhóm', () => {
  it('sales không sửa nội dung, biên tập viên không xử lý yêu cầu đặt tour', () => {
    expect(contentEditors(args('sales'))).toBe(false)
    expect(salesTeam(args('editor'))).toBe(false)
    expect(salesTeam(args('sales'))).toBe(true)
    expect(contentEditors(args('admin'))).toBe(true)
  })
})
