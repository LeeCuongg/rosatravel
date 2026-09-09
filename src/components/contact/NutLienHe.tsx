'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useTranslations } from 'next-intl'
import { PlanPopup } from './PlanPopup'

/**
 * Nút "Liên hệ" trên thanh điều hướng — MỞ POPUP, không điều hướng.
 *
 * Trước đây đây là một <Link> tới /lien-he. Nhược điểm không nằm ở tốc độ tải
 * mà ở chỗ nó BỎ RƠI thứ người đọc đang xem: đang giữa lịch trình ngày 3 của
 * một tour mà bấm "Liên hệ" là mất luôn vị trí đọc, và sau khi gửi xong không
 * có đường quay lại đúng chỗ cũ. Popup giữ nguyên trang phía sau.
 *
 * Trang /lien-he VẪN CÒN và không đổi gì: nó là đích của link chia sẻ, của kết
 * quả tìm kiếm, và của những người tắt JavaScript. Cái đổi ở đây chỉ là lối vào
 * từ thanh điều hướng.
 *
 * Tách thành component riêng thay vì biến cả Header thành client component:
 * Header không có state nào khác, và chuyển nó sang client là kéo toàn bộ phần
 * điều hướng (kể cả logo và các Link) vào bundle trình duyệt để đổi lấy đúng
 * một nút bấm.
 */
export function NutLienHe({ className = '' }: { className?: string }) {
  const t = useTranslations('nav')
  const [mo, setMo] = useState(false)
  const dong = useCallback(() => setMo(false), [])

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        className={`transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:text-clay-500 ${className}`}
      >
        {t('contact')}
      </button>

      {/* AnimatePresence để popup chạy hết animation thoát trước khi bị gỡ khỏi
          cây — đóng mà biến mất tức thì là thứ không được phép ở bất kỳ lớp phủ
          nào trên site này. */}
      <AnimatePresence>{mo && <PlanPopup onClose={dong} />}</AnimatePresence>
    </>
  )
}
