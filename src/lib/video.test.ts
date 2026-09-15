import { describe, expect, it } from 'vitest'

import { youtubeId } from './video'

describe('youtubeId', () => {
  it('nhận các dạng link YouTube phổ biến', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://m.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('không phải YouTube hoặc id sai định dạng thì null', () => {
    expect(youtubeId('https://vimeo.com/123456')).toBeNull()
    expect(youtubeId('https://www.youtube.com/watch?v=abc')).toBeNull()
    expect(youtubeId('không phải link')).toBeNull()
  })
})
