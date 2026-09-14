import { siFacebook, siInstagram, siMessenger, siThreads, siZalo } from 'simple-icons'

import { cn } from '@/lib/cn'
import type { ContactChannelKey } from '@/types/content'

const paths: Record<ContactChannelKey, string> = {
  zalo: siZalo.path,
  messenger: siMessenger.path,
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  threads: siThreads.path,
}

/** Icon kênh liên hệ, tô bằng `currentColor` để theo màu của nút chứa nó. */
export function BrandIcon({ channel, className }: { channel: ContactChannelKey; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      // Icon Zalo của simple-icons là cả chữ "Zalo" nằm ngang, ở cỡ 16–20px thành chữ li ti.
      // Phóng to bằng transform để đọc được mà không đổi kích thước khung chứa.
      className={cn(className, channel === 'zalo' && 'scale-[1.7]')}
    >
      <path d={paths[channel]} />
    </svg>
  )
}
