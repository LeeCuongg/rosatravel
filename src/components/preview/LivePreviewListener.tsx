'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/**
 * Đặt trên trang khi đang ở chế độ xem bản nháp: mỗi lần nhân viên sửa trong
 * admin (tự lưu), trang trong khung Live Preview tự tải lại dữ liệu mới.
 */
export function LivePreviewListener() {
  const router = useRouter()

  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}
    />
  )
}
