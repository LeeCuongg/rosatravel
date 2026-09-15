import { describe, expect, it } from 'vitest'

import { normalizeSearch, searchFragments, toSearchQuery, toSearchText } from './search'

describe('toSearchText + searchFragments', () => {
  const stored = toSearchText(['Tour Hồng Kông – Thâm Quyến', 'Phục vụ tận tình', null, 'Trung Quốc'])
  const matches = (query: string) => searchFragments(query).every((fragment) => stored.includes(fragment))

  it('lưu từng từ có ký tự bao quanh', () => {
    expect(stored).toBe('|tour|hong|kong|tham|quyen|phuc|vu|tan|tinh|trung|quoc|')
    expect(toSearchText([null, ''])).toBe('')
  })

  it('khớp theo từ, từ cuối khớp phần đầu', () => {
    expect(matches('hong kong')).toBe(true)
    expect(matches('Thâm Quy')).toBe(true)
    expect(matches('kong hong')).toBe(true)
  })

  it('không khớp nhầm giữa từ', () => {
    expect(matches('phu quoc')).toBe(false)
    expect(matches('ong kong')).toBe(false)
  })

  it('bỏ từ lặp', () => {
    expect(searchFragments('hong hong kong')).toEqual(['|hong|', '|kong'])
  })
})

describe('normalizeSearch', () => {
  it('bỏ dấu, đổi đ thành d, chữ thường, bỏ ký tự đặc biệt', () => {
    expect(normalizeSearch('Quảng Châu – HỒNG KÔNG!!')).toBe('quang chau hong kong')
    expect(normalizeSearch('Đà Nẵng')).toBe('da nang')
    expect(normalizeSearch('  Tour  4N3Đ  ')).toBe('tour 4n3d')
  })
})

describe('toSearchQuery', () => {
  it('quá ngắn hoặc trống thì không tìm', () => {
    expect(toSearchQuery('')).toBeNull()
    expect(toSearchQuery(' a ')).toBeNull()
    expect(toSearchQuery(undefined)).toBeNull()
  })

  it('cắt từ khóa quá dài', () => {
    expect(toSearchQuery('x'.repeat(200))?.length).toBe(80)
  })
})
