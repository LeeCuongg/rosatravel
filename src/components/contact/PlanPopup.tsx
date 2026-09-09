'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { ContactForm } from './ContactForm'
import { khoaCuonTrang, moKhoaCuonTrang } from '@/lib/motion/lenis'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { duration, easingArray } from '@/lib/motion/tokens'

/**
 * POPUP "LÊN KẾ HOẠCH" — lớp phủ THỨ BA, mở từ ngăn kéo địa điểm.
 *
 * Ngăn xếp đầy đủ khi nó hiện ra: bài "Chuyến đã đi" (z-100) → ngăn kéo địa
 * điểm (z-120) → popup này (z-140). Ba lớp nghe có vẻ nhiều, nhưng mỗi lớp trả
 * lời đúng một câu hỏi mà người đọc vừa đặt ra, và không lớp nào làm mất lớp
 * dưới: xem xong địa điểm thì quay lại đúng đoạn đang đọc, gửi xong biểu mẫu
 * thì quay lại đúng địa điểm.
 *
 * DÙNG LẠI ContactForm, không viết bản rút gọn. Cùng lý do đã ghi ở PlanTrip:
 * hai biểu mẫu song song là hai bộ validate và chắc chắn sẽ lệch nhau.
 *
 * Trạng thái đóng/mở nằm ở useState của component cha, KHÔNG đi qua URL như
 * ngăn kéo. Ngăn kéo cần URL vì một địa điểm là nội dung đáng chia sẻ và đáng
 * quay lại; một biểu mẫu trống thì không — gửi link "form đang mở" cho người
 * khác chẳng có nghĩa gì, mà thêm một tầng history chỉ làm nút Back khó đoán.
 */
export function PlanPopup({
  tenDiaDiem,
  onClose,
}: {
  /**
   * Tên địa điểm đang xem, nếu popup mở từ một ngăn kéo địa điểm.
   *
   * BỎ TRỐNG khi mở từ chỗ không gắn với địa điểm nào — ví dụ nút "Liên hệ"
   * trên thanh điều hướng. Khi đó phụ đề chuyển sang câu chung và ô ghi chú
   * để trống, chứ không điền sẵn "Quan tâm địa điểm: undefined".
   */
  tenDiaDiem?: string
  onClose: () => void
}) {
  const t = useTranslations('location')
  const tc = useTranslations('caseStudy')
  const tl = useTranslations('contact')
  const tier = useMotionTier()
  const panelRef = useRef<HTMLDivElement>(null)

  const thoiLuong = tier === 'reduced' ? 0.01 : duration.slow

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Bắt ở pha CAPTURE và chặn ngay, đúng như ngăn kéo làm với lớp phủ bài
      // viết: cả ba lớp đều nghe Escape trên `document`, không chặn thì một lần
      // nhấn đóng sạch cả ba và người đọc mất luôn bài đang dở.
      e.stopImmediatePropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, { capture: true })

    // Lần khoá cuộn thứ ba. Bộ đếm trong lib/motion/lenis.ts lo phần lồng nhau
    // — đóng popup KHÔNG được mở khoá cuộn trong khi ngăn kéo vẫn đang mở.
    const html = document.documentElement
    const overflowCu = html.style.overflow
    html.style.overflow = 'hidden'
    khoaCuonTrang()

    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey, { capture: true })
      html.style.overflow = overflowCu
      moKhoaCuonTrang()
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('planTitle')}
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-8"
    >
      <motion.button
        type="button"
        aria-label={tc('close')}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: thoiLuong, ease: easingArray.enter }}
        className="absolute inset-0 bg-sand-100/70"
      />

      {/* Nổi lên tại chỗ chứ không trượt từ mép: popup này mở ra ngay dưới nút
          vừa bấm, ở giữa màn hình. Trượt từ dưới lên sẽ đọc thành "một trang
          nữa vừa mở", trong khi đây là một hộp thoại nhỏ của chính ngăn kéo.
          Chỉ animate opacity và y — cả hai chạy trên compositor. */}
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        data-lenis-prevent
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: thoiLuong, ease: easingArray.enter }}
        // CÙNG BỘ MẶT với khối biểu mẫu ở cuối trang chủ (Frame tone="giay"):
        // nền trắng, bo 16px, viền nét đứt. Đây là CÙNG MỘT biểu mẫu, cùng một
        // việc phải làm — hai bộ mặt khác nhau cho cùng một thao tác khiến người
        // đã điền ở trang chủ tưởng đây là thứ khác.
        //
        // Rộng 800px và đệm 64px lấy theo modal của spotstravel.co (800px, đệm
        // 80px). Khung 576px cũ bóp hai ô "Họ và tên / Số điện thoại" thành hai
        // thanh mỏng vì bên trong biểu mẫu còn tự giới hạn 576px nữa.
        className="relative max-h-full w-full max-w-[50rem] overflow-y-auto overscroll-contain rounded-2xl border border-dashed border-rule bg-paper p-8 outline-none sm:p-16"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-label uppercase text-ink-500 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:text-accent"
          >
            <span
              aria-hidden
              className="relative h-6 w-6 rounded-full border border-dashed border-rule"
            >
              <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
            </span>
            {tc('close')}
          </button>
        </div>

        {/* Cỡ chữ và nhịp giãn khớp với khối biểu mẫu trên trang chủ: tiêu đề
            d2, phụ đề serif d4 trong cột hẹp. Giữ `text-accent` chứ không đổi
            thành `text-clay-500` — ngoài phạm vi một bài "Chuyến đã đi" thì hai
            màu đó BẰNG NHAU, còn bên trong bài thì popup phải mang màu riêng
            của bài, giống mọi thứ khác trong đó. */}
        <h2 className="font-display text-accent mt-2 text-center text-d2">{t('planTitle')}</h2>
        <p className="font-display mx-auto mt-5 max-w-md text-center text-d4 text-sand-200">
          {tenDiaDiem ? t('planSub', { name: tenDiaDiem }) : tl('popupSub')}
        </p>

        <div className="mt-12">
          {/* Không truyền `tours`: trang đang mở chỉ nạp địa điểm, không nạp
              danh sách tour — ô chọn tự ẩn. Ngữ cảnh "đang hỏi về nơi nào" đi
              theo đường ghi chú, xem giải thích ở ContactForm. */}
          <ContactForm defaultNote={tenDiaDiem ? t('planNote', { name: tenDiaDiem }) : ''} />
        </div>
      </motion.div>
    </div>
  )
}
