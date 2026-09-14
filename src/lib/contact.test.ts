import { describe, expect, it } from 'vitest'

import { buildChannelLinks, hotlineHref, toTelHref, toZaloHref } from './contact'

describe('toTelHref', () => {
  it('đổi số bắt đầu bằng 0 sang +84 và bỏ ký tự thừa', () => {
    expect(toTelHref('0973122807')).toBe('tel:+84973122807')
    expect(toTelHref('0973 122 807')).toBe('tel:+84973122807')
  })

  it('giữ nguyên số đã có mã quốc gia', () => {
    expect(toTelHref('+84 973 122 807')).toBe('tel:+84973122807')
    expect(toTelHref('84973122807')).toBe('tel:+84973122807')
  })
})

describe('toZaloHref', () => {
  it('số điện thoại → zalo.me/<số>', () => {
    expect(toZaloHref('0973 122 807')).toBe('https://zalo.me/0973122807')
  })

  it('link đầy đủ (Zalo OA) giữ nguyên', () => {
    expect(toZaloHref('https://zalo.me/123456789')).toBe('https://zalo.me/123456789')
  })
})

describe('buildChannelLinks', () => {
  it('bỏ kênh trống và giữ thứ tự zalo → messenger → facebook → instagram → threads', () => {
    const links = buildChannelLinks({
      threads: 'https://www.threads.net/@rosa',
      zalo: '0973122807',
      facebook: '   ',
      messenger: null,
      instagram: 'https://instagram.com/rosa',
    })

    expect(links).toEqual([
      { key: 'zalo', href: 'https://zalo.me/0973122807' },
      { key: 'instagram', href: 'https://instagram.com/rosa' },
      { key: 'threads', href: 'https://www.threads.net/@rosa' },
    ])
  })

  it('không có kênh nào thì trả mảng rỗng', () => {
    expect(buildChannelLinks({})).toEqual([])
  })
})

describe('hotlineHref', () => {
  it('trống thì null', () => {
    expect(hotlineHref({ hotline: '' })).toBeNull()
    expect(hotlineHref({ hotline: '0973122807' })).toBe('tel:+84973122807')
  })
})
