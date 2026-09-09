'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Eyebrow, Rule } from '@/components/ui/Frame'
import { TextButton, TextLink } from '@/components/ui/TextLink'
import { khoaCuonTrang, moKhoaCuonTrang } from '@/lib/motion/lenis'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { duration, easingArray } from '@/lib/motion/tokens'
import { docSlugTuUrl, dongNganKeo, theoDoiNganKeo } from './ngan-keo'
import { PlanPopup } from '@/components/contact/PlanPopup'
import type { Location } from '@/lib/content'

/**
 * NGĂN KÉO ĐỊA ĐIỂM — lớp phủ THỨ HAI, xếp chồng lên bài đang đọc.
 *
 * Bấm một thẻ địa điểm giữa bài không được làm mất bài. Người đọc đang ở giữa
 * ngày thứ ba của một chuyến đi; họ tò mò về cái quán vừa nhắc tới, xem xong
 * thì muốn đọc tiếp đúng chỗ đang dở. Điều hướng hẳn sang trang khác là bắt họ
 * tìm lại vị trí cũ — và phần lớn sẽ không quay lại.
 *
 * ĐIỀU KHIỂN BẰNG QUERY PARAM `?dia-diem=<slug>`, không phải intercepting route.
 * Đây là khác biệt có chủ đích so với lớp phủ thứ nhất (xem CaseOverlay):
 *
 *   Lớp 1 dùng intercepting route được vì nó thay ĐƯỜNG DẪN — từ `/vi` sang
 *   `/vi/chuyen-di/x`. Lớp 2 thì không: một URL chỉ có một đường dẫn, nên nếu
 *   ngăn kéo cũng đổi đường dẫn thành `/vi/dia-diem/y` thì route của bài không
 *   còn khớp nữa và lớp phủ thứ nhất bị gỡ khỏi cây — đúng thứ cần tránh.
 *   Query param nằm ngoài đường dẫn, nên bài vẫn khớp và vẫn đứng nguyên.
 *
 * spotstravel.co giải quyết y hệt, chỉ khác cú pháp: họ xếp cả ngăn xếp lớp phủ
 * vào hai tham số ngăn bằng dấu ngã — `?m=couples-getaway~ackermannshof&t=case~location`.
 *
 * KHÔNG tự truy vấn dữ liệu. Toàn bộ địa điểm của trang đã được nạp sẵn ở phía
 * server (bài viết và lịch trình tour đều nhúng chúng ở depth 2), nên ngăn kéo
 * chỉ việc tìm trong danh sách được truyền xuống. Mở ra là thấy ngay, không có
 * trạng thái chờ, và không tốn thêm một vòng gọi database nào.
 */

export function LocationDrawer({
  locations,
  locale,
}: {
  locations: Location[]
  locale: 'vi' | 'en'
}) {
  // Khởi tạo null chứ không đọc URL ngay: server render ra null, nên đọc URL ở
  // lần render đầu phía client sẽ lệch với HTML server gửi xuống và React báo
  // lỗi hydrate. Effect bên dưới đồng bộ ngay sau khi gắn vào cây.
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    setSlug(docSlugTuUrl())
    const huyTheoDoi = theoDoiNganKeo(setSlug)
    // popstate lo nút Back của trình duyệt VÀ nhánh history.back() lúc đóng.
    const onPop = () => setSlug(docSlugTuUrl())
    window.addEventListener('popstate', onPop)
    return () => {
      huyTheoDoi()
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  const diaDiem = slug ? locations.find((l) => l.slug === slug) : undefined

  return (
    // AnimatePresence giữ ngăn kéo trong cây đủ lâu để chạy hết animation
    // thoát. Không có nó, đóng là biến mất tức thì.
    <AnimatePresence>
      {diaDiem && <Panel key={diaDiem.slug} diaDiem={diaDiem} locale={locale} />}
    </AnimatePresence>
  )
}

/**
 * Tách thành component riêng để các hook bên trong chỉ chạy khi ngăn kéo THẬT
 * SỰ mở. Gộp chung với phần trên sẽ vi phạm quy tắc hook: `if (!diaDiem) return`
 * nằm trước useEffect thì số lần gọi hook đổi giữa các lần render.
 */
function Panel({ diaDiem, locale }: { diaDiem: Location; locale: 'vi' | 'en' }) {
  const t = useTranslations('location')
  const tc = useTranslations('caseStudy')
  const tier = useMotionTier()
  const panelRef = useRef<HTMLDivElement>(null)
  const dayAnhRef = useRef<HTMLDivElement>(null)
  const [anhHienTai, setAnhHienTai] = useState(0)
  const [moKeHoach, setMoKeHoach] = useState(false)

  /**
   * Cùng một sự thật, giữ ở hai nơi, vì hai nơi cần nó theo hai kiểu: JSX cần
   * state để render lại, còn bộ nghe Escape cần một ô nhớ đọc được mà KHÔNG
   * phải đăng ký lại listener mỗi lần popup bật/tắt. Đăng ký lại sẽ đẩy nó
   * xuống cuối hàng đợi listener của `document` và làm hỏng đúng thứ tự mà
   * đoạn dưới đang dựa vào.
   */
  const keHoachRef = useRef(false)

  const dong = useCallback(() => dongNganKeo(), [])
  const moKeHoachRa = useCallback(() => {
    keHoachRef.current = true
    setMoKeHoach(true)
  }, [])
  const dongKeHoach = useCallback(() => {
    keHoachRef.current = false
    setMoKeHoach(false)
  }, [])

  // Người đã bật "giảm chuyển động" trong hệ điều hành vẫn cần thấy ngăn kéo,
  // chỉ là không có gì trượt. Rút thời lượng gần bằng 0 thay vì bỏ hẳn
  // AnimatePresence — bỏ hẳn sẽ tạo ra hai nhánh JSX phải bảo trì song song.
  const thoiLuong = tier === 'reduced' ? 0.01 : duration.slow

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return

      // Popup "Lên kế hoạch" đang mở thì Escape thuộc về NÓ, không thuộc về
      // ngăn kéo. Phải nhường ở đây chứ không thể để popup tự chặn:
      // stopImmediatePropagation chỉ cắt được các listener ĐĂNG KÝ SAU trên
      // cùng một nút, mà ngăn kéo luôn gắn listener trước popup (nó mount
      // trước). Đã đo: một lần nhấn Escape đóng sạch cả popup lẫn ngăn kéo và
      // xoá luôn tham số ?dia-diem khỏi URL.
      if (keHoachRef.current) return

      // Bắt ở pha CAPTURE và chặn ngay: lớp phủ bài viết bên dưới cũng nghe
      // Escape trên `document`. Không chặn thì một lần nhấn Escape đóng cả hai
      // lớp cùng lúc — người đọc mất luôn bài đang dở.
      e.stopImmediatePropagation()
      dong()
    }
    document.addEventListener('keydown', onKey, { capture: true })

    // Khoá cuộn nền. Khi ngăn kéo mở BÊN TRONG lớp phủ bài viết thì đây là lần
    // khoá thứ hai — bộ đếm trong lib/motion/lenis.ts lo phần lồng nhau.
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
  }, [dong])

  const theoDoiCuonAnh = () => {
    const el = dayAnhRef.current
    if (!el) return
    const beRong = el.scrollWidth / diaDiem.images.length
    setAnhHienTai(Math.round(el.scrollLeft / beRong))
  }

  const nhayToiAnh = (i: number) => {
    const el = dayAnhRef.current
    if (!el) return
    el.scrollTo({ left: (el.scrollWidth / diaDiem.images.length) * i, behavior: 'smooth' })
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={diaDiem.name[locale] ?? diaDiem.name.vi}
      // Cao hơn CaseOverlay (z-100) vì nó nằm ĐÈ LÊN lớp phủ đó.
      className="fixed inset-0 z-[120] flex justify-end"
    >
      <motion.button
        type="button"
        aria-label={tc('close')}
        onClick={dong}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: thoiLuong, ease: easingArray.enter }}
        className="absolute inset-0 bg-sand-100/55"
      />

      {/* Trên điện thoại chiếm gần hết bề ngang; từ sm trở lên là ngăn kéo bên
          phải, chừa lại một dải để người đọc vẫn thấy bài mình đang dở nằm sau. */}
      {/* Trượt vào từ phải. Chỉ animate `x` — đây là thuộc tính transform, trình
          duyệt chạy nó trên compositor mà không phải bố cục lại hay vẽ lại. Đổi
          `width` hay `right` sẽ cho cùng hiệu ứng nhìn nhưng làm rớt khung hình
          trên máy yếu, đúng thứ cần tránh.

          KHÔNG dùng flex-col cho panel: trong một cột flex, mọi con đều có
          flex-shrink: 1, nên khi nội dung dài hơn panel thì trình duyệt NÉN
          chúng lại thay vì để tràn ra và cuộn. Dải ảnh cao 271px từng bị bóp
          còn 41px — đã đo. */}
      {/* `data-lenis-prevent`: panel này VỪA là vùng cuộn VỪA nằm dưới một
          lenis.stop() (xem khoaCuonTrang ở effect trên). Lenis khi đã stop sẽ
          preventDefault() mọi wheel trên trang, nên thiếu thuộc tính này thì
          ngăn kéo có thanh cuộn mà lăn chuột không chạy. Thuộc tính khiến Lenis
          thoát sớm khi thấy phần tử trong composedPath. */}
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        data-lenis-prevent
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: thoiLuong, ease: easingArray.enter }}
        className="relative h-full w-[calc(100%-2rem)] max-w-3xl overflow-y-auto overscroll-contain bg-ink-950 outline-none sm:w-[62%]"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <button
            type="button"
            onClick={dong}
            className="flex items-center gap-2 text-label uppercase text-ink-500 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:text-accent"
          >
            <span aria-hidden className="relative h-6 w-6 rounded-full border border-dashed border-rule">
              <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
            </span>
            {tc('close')}
          </button>

          {/* Trước đây chỗ này là liên kết "Xem trang đầy đủ" — nó ĐƯA NGƯỜI
              ĐỌC RA KHỎI bài đang dở, đúng cái mà cả ngăn kéo sinh ra để tránh.
              Người vừa mở một homestay giữa chuyến đi đang ở rất gần lúc muốn
              hỏi; đưa biểu mẫu tới tận nơi ngắn hơn nhiều so với đẩy họ sang
              một trang khác rồi mong họ tự tìm đường liên hệ.

              Trang /dia-diem/<slug> vẫn còn nguyên, vẫn nằm trong sitemap và
              vẫn là cửa vào từ Google — chỉ không còn được nối từ đây. */}
          <TextButton onClick={moKeHoachRa} size="sm">
            {t('planTrip')}
          </TextButton>
        </div>

        <h2 className="font-display text-accent px-6 pt-6 pb-10 text-center text-d2">
          {diaDiem.name[locale] ?? diaDiem.name.vi}
        </h2>

        {/* Dải ảnh cuộn ngang bằng scroll-snap của CSS, không dùng thư viện
            carousel. Vuốt trên điện thoại và kéo thanh cuộn trên máy tính đều
            hoạt động sẵn, và nếu JavaScript hỏng thì nó vẫn là một dải ảnh cuộn
            được — không phải một khối đứng im. */}
        <div
          ref={dayAnhRef}
          onScroll={theoDoiCuonAnh}
          className="flex snap-x snap-mandatory items-start gap-2 overflow-x-auto px-6 pb-4"
        >
          {diaDiem.images.map((anh, i) => (
            <div
              key={`${anh.src}-${i}`}
              className="relative aspect-[4/5] w-[70%] shrink-0 snap-center overflow-hidden sm:w-[45%]"
            >
              <Media
                media={anh}
                locale={locale}
                fill
                sizes="(max-width: 640px) 70vw, 30vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {diaDiem.images.length > 1 && (
          <div className="flex justify-center gap-2 pb-8">
            {diaDiem.images.map((anh, i) => (
              <button
                key={`cham-${anh.src}-${i}`}
                type="button"
                onClick={() => nhayToiAnh(i)}
                aria-label={t('goToImage', { n: i + 1 })}
                aria-current={i === anhHienTai}
                className={`h-2 w-2 rounded-full transition-colors duration-[var(--duration-fast)] ${
                  i === anhHienTai ? 'bg-accent' : 'bg-rule-strong'
                }`}
              />
            ))}
          </div>
        )}

        <div className="space-y-6 px-6 pb-12">
          {diaDiem.address && (
            <div className="rounded-lg border border-dashed border-rule p-5">
              <Eyebrow className="text-accent">{t('address')}</Eyebrow>
              <p className="mt-3 text-meta">{diaDiem.address}</p>
            </div>
          )}

          {diaDiem.website && (
            <div className="rounded-lg border border-dashed border-rule p-5">
              <Eyebrow className="text-accent">{t('website')}</Eyebrow>
              <p className="mt-3 text-meta">
                <TextLink href={diaDiem.website} size="sm">
                  {diaDiem.website}
                </TextLink>
              </p>
            </div>
          )}

          <div className="rounded-lg border border-dashed border-rule p-5">
            <div className="space-y-4">
              {/* key theo index: mảng đoạn văn cố định, hai đoạn trùng chữ vẫn
                  là hai đoạn riêng. */}
              {diaDiem.body.map((doan, i) => (
                <p key={i} className="text-meta text-sand-200">
                  {doan[locale] ?? doan.vi}
                </p>
              ))}
            </div>
          </div>

          <Rule />
          <p className="text-center">
            <span className="text-label uppercase text-ink-500">
              {t(`category.${diaDiem.category}`)}
            </span>
          </p>
        </div>
      </motion.div>

      {/* AnimatePresence riêng cho popup: nó đóng bằng useState, nên React sẽ
          gỡ khỏi cây ngay lập tức nếu không có ai giữ lại — và lớp phủ biến
          mất đột ngột là thứ không được phép xảy ra ở bất kỳ lớp nào. */}
      <AnimatePresence>
        {moKeHoach && (
          <PlanPopup
            tenDiaDiem={diaDiem.name[locale] ?? diaDiem.name.vi}
            onClose={dongKeHoach}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
