import { describe, expect, it } from 'vitest'

import { slugifyVi } from './slugify'

describe('slugifyVi', () => {
  it('bỏ dấu tiếng Việt, đổi đ thành d, nối bằng gạch ngang', () => {
    expect(slugifyVi('Tour Hà Giang 3 ngày 2 đêm')).toBe('tour-ha-giang-3-ngay-2-dem')
    expect(slugifyVi('Đà Nẵng – Hội An')).toBe('da-nang-hoi-an')
  })

  it('bỏ ký tự đặc biệt và gạch ngang thừa ở hai đầu', () => {
    expect(slugifyVi('  Tour "HOT" mùa thu!!  ')).toBe('tour-hot-mua-thu')
    expect(slugifyVi('Sa Pa: 2N1Đ (2026)')).toBe('sa-pa-2n1d-2026')
  })
})
