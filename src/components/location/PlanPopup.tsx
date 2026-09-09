'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { ContactForm } from '@/components/contact/ContactForm'
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
  tenDiaDiem: string
  onClose: () => void
}) {
  const t = useTranslations('location')
  const tc = useTranslations('caseStudy')
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
        className="relative max-h-full w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-dashed border-rule bg-ink-950 p-6 outline-none sm:p-10"
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

        <h2 className="font-display text-accent mt-2 text-center text-d3">{t('planTitle')}</h2>
        <p className="mx-auto mt-4 max-w-sm text-center text-meta text-sand-200">
          {t('planSub', { name: tenDiaDiem })}
        </p>

        <div className="mt-10">
          {/* Không truyền `tours`: trang đang mở chỉ nạp địa điểm, không nạp
              danh sách tour — ô chọn tự ẩn. Ngữ cảnh "đang hỏi về nơi nào" đi
              theo đường ghi chú, xem giải thích ở ContactForm. */}
          <ContactForm defaultNote={t('planNote', { name: tenDiaDiem })} />
        </div>
      </motion.div>
    </div>
  )
}
