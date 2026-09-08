'use client'

import type { MouseEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { moNganKeo } from './ngan-keo'
import type { Location } from '@/lib/content'

/**
 * THẺ ĐỊA ĐIỂM — ảnh bên trái, chữ bên phải, viền nét đứt.
 *
 * Đây là thứ nhúng vào giữa bài viết để cắt một dải chữ dài. Nó KHÔNG phải
 * thẻ tour: không có giá, không có nút đặt. Việc duy nhất của nó là nói "chỗ
 * này có thật, đây là ảnh, bấm vào xem thêm".
 *
 * Vẫn là thẻ <a> với `href` thật tới /dia-diem/<slug>, DÙ bấm bình thường sẽ
 * mở ngăn kéo chứ không điều hướng. Giữ href thật là bắt buộc, không phải cho
 * đẹp: Ctrl/Cmd+bấm mở tab mới, chuột giữa, "Mở trong tab mới", trình đọc màn
 * hình đọc ra đích đến, và Google theo được liên kết. Một <div onClick> mất
 * sạch những thứ đó.
 *
 * Ảnh nằm bên trái với tỉ lệ cố định 4/3 và `object-cover`: địa điểm được chụp
 * bằng đủ loại máy ở đủ tỉ lệ, và một hàng thẻ mà mỗi cái cao một kiểu thì cả
 * khối trông như bị vỡ. Cắt ảnh là cái giá phải trả cho việc đó.
 */
export function LocationCard({
  location,
  locale,
  /**
   * Bật ngăn kéo. Tắt ở NHỮNG NƠI KHÔNG CÓ <LocationDrawer> đứng cạnh — cụ thể
   * là khối "Địa điểm khác" ở cuối chính trang địa điểm. Ở đó, đổi tham số URL
   * sẽ không mở ra gì cả và thẻ trông như hỏng; điều hướng thẳng mới đúng.
   */
  nganKeo = true,
}: {
  location: Location
  locale: 'vi' | 'en'
  nganKeo?: boolean
}) {
  const t = useTranslations('location')
  const localeHienTai = useLocale()
  const ten = location.name[locale] ?? location.name.vi

  const bam = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!nganKeo) return
    // Nhường lại cho trình duyệt mọi kiểu bấm mang ý "mở ở chỗ khác": Ctrl/Cmd
    // (tab mới), Shift (cửa sổ mới), Alt (tải về), và mọi nút chuột không phải
    // nút trái. Nuốt hết những thao tác này là lấy mất quyền của người dùng.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    // Đổi URL bằng History API gốc, KHÔNG qua router của Next — lý do đầy đủ ở
    // đầu file ./ngan-keo.ts. Tóm tắt: router.push coi việc thêm tham số là một
    // lần điều hướng, và intercepting route sẽ khớp rồi dựng thêm một bản lớp
    // phủ của chính bài đang đọc.
    moNganKeo(location.slug)
  }

  return (
    <a
      href={`/${localeHienTai}/dia-diem/${location.slug}`}
      onClick={bam}
      className="group grid grid-cols-[7.5rem_1fr] items-stretch gap-0 border border-dashed border-rule transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] hover:border-rule-strong sm:grid-cols-[13rem_1fr]"
    >
      <div className="relative aspect-[4/3] h-full w-full overflow-hidden">
        <Media
          media={location.images[0]}
          locale={locale}
          fill
          // Thẻ nằm trong cột chữ rộng tối đa 900px trừ đệm; ô ảnh dừng ở 208px.
          sizes="(max-width: 640px) 120px, 208px"
          className="object-cover transition-transform duration-[var(--duration-slower)] ease-[var(--ease-hover)] group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-2 p-4 sm:p-6">
        <p className="text-label uppercase text-ink-500">{t(`category.${location.category}`)}</p>
        <h4 className="font-display text-d4 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-hover)] group-hover:text-accent">
          {ten}
        </h4>
        {/* line-clamp-2: phần tóm tắt do người nhập gõ, không có gì chặn độ dài.
            Một đoạn dài bất thường sẽ kéo cao đúng một thẻ và phá vỡ nhịp cả
            khối — cắt ở hai dòng là ràng buộc thị giác, không phải ràng buộc
            nội dung (bài đầy đủ nằm trong ngăn kéo và ở trang riêng). */}
        <p className="line-clamp-2 text-meta text-ink-500">
          {location.excerpt[locale] ?? location.excerpt.vi}
        </p>
      </div>
    </a>
  )
}
