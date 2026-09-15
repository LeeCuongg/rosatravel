import { describe, expect, it } from 'vitest'

import { firstParam, withQuery } from './url'

describe('withQuery', () => {
  it('bỏ giá trị rỗng, mã hóa ký tự tiếng Việt', () => {
    expect(withQuery('/danh-muc/mua-thu', { 'diem-di': 'Hà Nội', gia: null, trang: 2, thang: '' })).toBe(
      '/danh-muc/mua-thu?diem-di=H%C3%A0+N%E1%BB%99i&trang=2',
    )
  })

  it('không có tham số thì giữ nguyên đường dẫn', () => {
    expect(withQuery('/cam-nang', { trang: null })).toBe('/cam-nang')
  })
})

describe('firstParam', () => {
  it('lấy phần tử đầu khi là mảng', () => {
    expect(firstParam(['a', 'b'])).toBe('a')
    expect(firstParam('x')).toBe('x')
    expect(firstParam(undefined)).toBeUndefined()
  })
})
