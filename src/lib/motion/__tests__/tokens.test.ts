import { describe, expect, it } from 'vitest'
import { duration, easing, stagger, distance } from '../tokens'

describe('motion tokens', () => {
  it('cung cấp 4 mức duration tăng dần', () => {
    expect(duration.fast).toBeLessThan(duration.base)
    expect(duration.base).toBeLessThan(duration.slow)
    expect(duration.slow).toBeLessThan(duration.slower)
  })

  it('duration tính bằng giây để dùng trực tiếp với gsap và motion', () => {
    expect(duration.base).toBe(0.3)
  })

  it('cung cấp easing cho enter, scrub, hover', () => {
    expect(easing.enter).toBeDefined()
    expect(easing.scrub).toBeDefined()
    expect(easing.hover).toBeDefined()
  })

  it('stagger và distance có giá trị dùng được', () => {
    expect(stagger).toBe(0.06)
    expect(distance).toBe(24)
  })
})
