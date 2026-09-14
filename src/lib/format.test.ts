import { describe, expect, it } from 'vitest'

import { discountPercent, formatVnd } from './format'

describe('formatVnd', () => {
  it('ngăn cách hàng nghìn bằng dấu chấm và thêm đ', () => {
    expect(formatVnd(3180000)).toBe('3.180.000đ')
    expect(formatVnd(0)).toBe('0đ')
  })
})

describe('discountPercent', () => {
  it('tính phần trăm giảm, làm tròn xuống', () => {
    expect(discountPercent(3180000, 3498000)).toBe(9)
  })

  it('trả null khi không có giá gốc, hoặc giá gốc không lớn hơn giá bán', () => {
    expect(discountPercent(3180000)).toBeNull()
    expect(discountPercent(3180000, null)).toBeNull()
    expect(discountPercent(3180000, 3180000)).toBeNull()
    expect(discountPercent(3180000, 2000000)).toBeNull()
  })
})
