import { describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

import { shouldRevalidateChange } from './revalidate'

describe('shouldRevalidateChange', () => {
  it('xuất bản thì làm mới', () => {
    expect(shouldRevalidateChange({ doc: { _status: 'published' }, previousDoc: { _status: 'draft' }, autosave: false })).toBe(true)
  })

  it('gỡ xuất bản (published → draft) thì làm mới để trang biến mất', () => {
    expect(shouldRevalidateChange({ doc: { _status: 'draft' }, previousDoc: { _status: 'published' }, autosave: false })).toBe(true)
  })

  it('tạo bản nháp mới thì không làm mới', () => {
    expect(shouldRevalidateChange({ doc: { _status: 'draft' }, previousDoc: {}, autosave: false })).toBe(false)
  })

  it('tự lưu nháp thì không làm mới, kể cả khi tài liệu đang xuất bản', () => {
    expect(shouldRevalidateChange({ doc: { _status: 'draft' }, previousDoc: { _status: 'published' }, autosave: true })).toBe(false)
  })

  it('collection không có drafts: mọi lần lưu đều làm mới', () => {
    expect(shouldRevalidateChange({ doc: { }, previousDoc: {}, autosave: false })).toBe(false)
    expect(shouldRevalidateChange({ doc: { _status: undefined, ...{ name: 'x' } } as never, previousDoc: {}, autosave: false })).toBe(true)
  })
})
