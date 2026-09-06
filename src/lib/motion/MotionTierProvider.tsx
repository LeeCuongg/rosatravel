'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { readDeviceSignals, resolveMotionTier, type MotionTier } from './tier'

/**
 * Mặc định 'reduced' trước khi đo được thiết bị. Render lần đầu không chạy
 * animation nào — an toàn hơn là bật hiệu ứng rồi tắt, vốn gây nháy.
 */
const MotionTierContext = createContext<MotionTier>('reduced')

export function MotionTierProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<MotionTier>('reduced')

  useEffect(() => {
    const update = () => setTier(resolveMotionTier(readDeviceSignals()))
    update()

    // Người dùng có thể bật/tắt reduce motion trong lúc đang xem trang.
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return <MotionTierContext.Provider value={tier}>{children}</MotionTierContext.Provider>
}

export function useMotionTier(): MotionTier {
  return useContext(MotionTierContext)
}
