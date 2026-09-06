import { describe, expect, it } from 'vitest'
import { formatPrice } from '../format'

describe('formatPrice', () => {
  it('định dạng tiền Việt có dấu phân cách nghìn', () => {
    // Intl dùng ký tự khoảng trắng hẹp không ngắt cho vi-VN; so sánh phần số.
    expect(formatPrice(6900000, 'vi')).toMatch(/6\.900\.000/)
  })

  it('không hiển thị phần thập phân cho VND', () => {
    expect(formatPrice(6900000, 'vi')).not.toContain(',00')
  })

  it('kèm ký hiệu đơn vị', () => {
    expect(formatPrice(6900000, 'vi')).toMatch(/₫|VND/)
  })
})
