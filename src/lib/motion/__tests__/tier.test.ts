import { describe, expect, it } from 'vitest'
import { resolveMotionTier, type DeviceSignals } from '../tier'

const strongDesktop: DeviceSignals = {
  prefersReducedMotion: false,
  coarsePointer: false,
  deviceMemory: 16,
  hardwareConcurrency: 12,
}

describe('resolveMotionTier', () => {
  it('trả về full cho desktop mạnh', () => {
    expect(resolveMotionTier(strongDesktop)).toBe('full')
  })

  it('prefers-reduced-motion thắng mọi tín hiệu khác', () => {
    expect(resolveMotionTier({ ...strongDesktop, prefersReducedMotion: true })).toBe('reduced')
  })

  it('con trỏ thô (cảm ứng) xuống lite dù máy mạnh', () => {
    expect(resolveMotionTier({ ...strongDesktop, coarsePointer: true })).toBe('lite')
  })

  it('RAM thấp xuống lite', () => {
    expect(resolveMotionTier({ ...strongDesktop, deviceMemory: 4 })).toBe('lite')
  })

  it('ít nhân CPU xuống lite', () => {
    expect(resolveMotionTier({ ...strongDesktop, hardwareConcurrency: 4 })).toBe('lite')
  })

  it('trình duyệt không báo deviceMemory thì không bị phạt oan', () => {
    expect(
      resolveMotionTier({ ...strongDesktop, deviceMemory: undefined }),
    ).toBe('full')
  })

  it('trình duyệt không báo hardwareConcurrency thì không bị phạt oan', () => {
    expect(
      resolveMotionTier({ ...strongDesktop, hardwareConcurrency: undefined }),
    ).toBe('full')
  })
})
