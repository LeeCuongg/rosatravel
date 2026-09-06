export type MotionTier = 'reduced' | 'lite' | 'full'

export interface DeviceSignals {
  prefersReducedMotion: boolean
  coarsePointer: boolean
  /** navigator.deviceMemory — Safari không có, sẽ là undefined. */
  deviceMemory?: number
  /** navigator.hardwareConcurrency — hầu hết trình duyệt đều có. */
  hardwareConcurrency?: number
}

const LOW_MEMORY_GB = 4
const LOW_CORE_COUNT = 4

/**
 * Hàm thuần để test được không cần DOM.
 *
 * Quy tắc: tín hiệu thiếu (undefined) KHÔNG bị coi là máy yếu. Safari không
 * expose deviceMemory; phạt undefined sẽ tắt hiệu ứng của toàn bộ Safari desktop.
 */
export function resolveMotionTier(signals: DeviceSignals): MotionTier {
  if (signals.prefersReducedMotion) return 'reduced'

  const lowMemory = signals.deviceMemory !== undefined && signals.deviceMemory <= LOW_MEMORY_GB
  const lowCores =
    signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency <= LOW_CORE_COUNT

  if (signals.coarsePointer || lowMemory || lowCores) return 'lite'
  return 'full'
}

/** Đọc tín hiệu thật từ trình duyệt. Chỉ gọi ở client. */
export function readDeviceSignals(): DeviceSignals {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
  }
}
