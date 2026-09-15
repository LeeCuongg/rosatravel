import { describe, expect, it } from 'vitest'

import { previewPath, previewUrl } from './preview'

describe('previewPath', () => {
  it('mỗi loại nội dung có đường dẫn riêng', () => {
    expect(previewPath({ collection: 'tours', slug: 'ha-giang' })).toBe('/tour/ha-giang')
    expect(previewPath({ collection: 'posts', slug: 'meo-du-lich' })).toBe('/cam-nang/meo-du-lich')
    expect(previewPath({ collection: 'pages', slug: 'gioi-thieu' })).toBe('/gioi-thieu')
    expect(previewPath({ global: 'home' })).toBe('/')
  })

  it('chưa có slug thì chưa xem trước được', () => {
    expect(previewPath({ collection: 'tours', slug: '' })).toBeNull()
  })

  it('tiếng Việt không có tiền tố, ngôn ngữ khác thì có', () => {
    expect(previewPath({ collection: 'tours', slug: 'ha-giang' }, 'vi')).toBe('/tour/ha-giang')
    expect(previewPath({ collection: 'tours', slug: 'ha-giang' }, 'en')).toBe('/en/tour/ha-giang')
    expect(previewPath({ global: 'home' }, 'en')).toBe('/en')
  })
})

describe('previewUrl', () => {
  it('mã hóa đường dẫn trong query', () => {
    expect(previewUrl('/tour/ha-giang')).toMatch(/\/next\/preview\?path=%2Ftour%2Fha-giang$/)
    expect(previewUrl(null)).toBeNull()
  })
})
