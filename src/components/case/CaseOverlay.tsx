'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from '@/i18n/navigation'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { khoaCuonTrang, moKhoaCuonTrang } from '@/lib/motion/lenis'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { duration, easingArray } from '@/lib/motion/tokens'

/**
 * LỚP PHỦ bọc quanh một bài "Chuyến đã đi".
 *
 * Chỉ lo phần KHUNG: nền tối phía sau, thanh trên dính, nút đóng, khoá cuộn
 * trang nền. Nội dung bài do CaseArticle render và truyền vào qua children —
 * xem giải thích ở đầu file đó.
 *
 * Cách nó được mở: intercepting route của Next.js
 * (src/app/[locale]/@modal/(.)chuyen-di/[slug]). Bấm thẻ từ trang chủ thì
 * Next chặn điều hướng lại và render bài vào khe @modal, trong khi trang chủ
 * vẫn còn nguyên phía sau. Mở thẳng link hoặc tải lại (F5) thì không có gì để
 * chặn, và trang đầy đủ /chuyen-di/<slug> hiện ra bình thường.
 *
 * Nghĩa là URL luôn thật: gửi link cho người khác được, nút Back của trình
 * duyệt đóng lớp phủ đúng như mong đợi, và Google đọc được nội dung. Một lớp
 * phủ điều khiển bằng useState không có bất kỳ tính chất nào trong số đó.
 */
export function CaseOverlay({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string
  subtitle: string
  accent: string
  children: ReactNode
}) {
  const router = useRouter()
  const t = useTranslations('caseStudy')
  const tier = useMotionTier()
  const panelRef = useRef<HTMLDivElement>(null)

  /**
   * Lớp phủ này do ROUTER dựng lên (intercepting route), nên khi điều hướng đi
   * là React gỡ nó khỏi cây ngay lập tức — không có chỗ nào để chạy animation
   * thoát, và đóng thành ra biến mất đột ngột. AnimatePresence cũng không cứu
   * được vì cha của nó cũng bị thay.
   *
   * Cách duy nhất còn lại: tự giữ cờ "đang đóng", chạy hết animation, RỒI mới
   * gọi router.back() trong onAnimationComplete.
   */
  const [dangDong, setDangDong] = useState(false)
  const dong = useCallback(() => setDangDong(true), [])

  const thoiLuong = tier === 'reduced' ? 0.01 : duration.slow

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    document.addEventListener('keydown', onKey)

    // Khoá cuộn trang nền. Không khoá thì lăn chuột tới cuối bài sẽ "xuyên"
    // xuống trang chủ phía dưới — lỗi kinh điển của mọi lớp phủ.
    //
    // PHẢI làm cả hai việc, không được bỏ việc nào:
    //   - `overflow: hidden` lo cho thiết bị ở tier `reduced`, nơi Lenis không
    //     chạy và trình duyệt tự cuộn.
    //   - `khoaCuonTrang()` gọi thẳng lenis.stop() cho các tier còn lại. Lenis
    //     cuộn bằng JS nên overflow hidden không chạm được tới nó — đã thử gỡ
    //     class `lenis` khỏi <html> thay thế, và cách đó KHÔNG hiệu quả: class
    //     được gắn lại khi cây React render lại lúc điều hướng.
    const html = document.documentElement
    const overflowCu = html.style.overflow
    html.style.overflow = 'hidden'
    khoaCuonTrang()

    // Chuyển tiêu điểm bàn phím vào trong lớp phủ. Thiếu bước này, người dùng
    // bàn phím nhấn Tab sẽ đi lang thang trong các liên kết của trang chủ nằm
    // phía sau — thứ họ không nhìn thấy và không định thao tác.
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      html.style.overflow = overflowCu
      moKhoaCuonTrang()
    }
  }, [dong])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-accent={accent}
      className="fixed inset-0 z-[100] flex flex-col"
    >
      {/* Nền tối. Là <button> chứ không phải <div onClick>: bấm ra ngoài để
          đóng phải dùng được bằng bàn phím, và một <div> có onClick thì trình
          đọc màn hình không thông báo gì cả. */}
      <motion.button
        type="button"
        aria-label={t('close')}
        onClick={dong}
        initial={{ opacity: 0 }}
        animate={{ opacity: dangDong ? 0 : 1 }}
        transition={{ duration: thoiLuong, ease: easingArray.enter }}
        className="absolute inset-0 bg-sand-100/45 backdrop-blur-[2px]"
      />

      {/* Trượt lên từ mép dưới. Chỉ animate `y` (transform) — trình duyệt chạy
          nó trên compositor, không phải tính lại bố cục hay vẽ lại từng khung.
          Animate `top` hay `height` cho ra cùng hiệu ứng nhìn nhưng rớt khung
          hình trên máy yếu. */}
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: dangDong ? '100%' : 0 }}
        transition={{ duration: thoiLuong, ease: easingArray.enter }}
        onAnimationComplete={() => {
          // Cũng chạy sau animation VÀO, nên phải kiểm cờ — thiếu `if` này thì
          // lớp phủ tự đóng ngay khi vừa mở xong.
          //
          // router.back() chứ không phải router.push('/'): lớp phủ được mở bằng
          // một lần điều hướng, nên đóng nó phải là đi LÙI lại — có thế người
          // đọc mới quay về đúng vị trí cuộn cũ. push('/') sẽ ném họ về đầu
          // trang và chất thêm một mục vào lịch sử, khiến nút Back không thoát
          // ra được.
          if (dangDong) router.back()
        }}
        // KHÔNG chừa lề trên: lớp phủ ăn trọn chiều cao màn hình.
        //
        // Bản trước để 40px hở trên đỉnh (đúng con số của spotstravel.co). Nhưng
        // họ không có thanh điều hướng dính ở đó, còn mình có: dải hở 40px cắt
        // ngang giữa header, để lộ logo bên trái và menu bên phải trong khi
        // phần giữa bị che. Nó không đọc ra là "một lớp phủ chừa mép", nó đọc
        // ra là một khối bị đặt lệch.
        //
        // Bề ngang thì lấy đúng luật của họ, đã đo ở hai khổ màn hình:
        // 1440px → panel 1296px (90%), 1920px → panel 1360px. Tức là
        // `min(90%, 1360px)` — rộng theo màn hình nhưng có trần, vì một dòng
        // chữ dài quá 1360px thì mắt lạc dòng khi xuống hàng.
        className="relative mx-auto flex h-svh w-[90%] max-w-[85rem] flex-col overflow-hidden bg-ink-950 outline-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-dashed border-rule px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={dong}
            className="flex shrink-0 items-center gap-2 text-label uppercase text-ink-500 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:text-accent"
          >
            {/* Dấu × vẽ bằng hai gạch xoay, không dùng ký tự: ký tự đổi hình
                theo font và căn giữa lệch ở mỗi họ chữ. */}
            <span
              aria-hidden
              className="relative h-6 w-6 rounded-full border border-dashed border-rule"
            >
              <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
            </span>
            {t('close')}
          </button>

          {/* Tiêu đề ở thanh trên chỉ hiện từ sm trở lên: trên điện thoại, nó
              cạnh tranh chỗ với nút đóng và cả hai đều bị cắt cụt. Bài đã có
              tiêu đề khổ lớn ngay bên dưới nên không mất thông tin gì. */}
          <p className="hidden min-w-0 items-baseline gap-3 sm:flex">
            <span className="font-display truncate text-d4">{title}</span>
            <span className="font-display truncate text-meta text-ink-500 italic">{subtitle}</span>
          </p>

          <div className="shrink-0" />
        </div>

        {/* Vùng cuộn riêng của lớp phủ. `overscroll-contain` chặn nốt trường
            hợp cuộn tới đáy rồi tiếp tục lăn: không có nó, trình duyệt chuyển
            đà cuộn sang trang nền.

            `data-lenis-prevent` là BẮT BUỘC, không phải tuỳ chọn. Lenis đang ở
            trạng thái stop() (xem effect khoá cuộn phía trên), mà khi đã stop
            nó gọi preventDefault() cho MỌI sự kiện wheel trên trang — kể cả
            wheel rơi vào vùng này. Hậu quả: lớp phủ có thanh cuộn nhưng lăn
            chuột không nhúc nhích. Thuộc tính này khiến Lenis thấy phần tử
            trong composedPath và thoát sớm, TRƯỚC nhánh preventDefault đó. */}
        <div data-lenis-prevent className="grow overflow-y-auto overscroll-contain">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
