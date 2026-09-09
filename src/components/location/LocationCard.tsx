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
      // NỀN TRẮNG trên nền kem — thẻ nổi lên bằng chính màu nền của nó, không
      // cần viền đậm. Trước đây thẻ trong suốt nên nó chìm vào khung bao ngoài
      // và cả khối đọc ra như một danh sách gạch đầu dòng có ảnh, chứ không ra
      // những tấm thẻ rời.
      //
      // `p-0.5` (2px) là viền trắng mảnh chạy quanh ảnh — số của Spots, và nó
      // kéo theo bán kính LỒNG: hộp ngoài 8px, ảnh bên trong 6px (8 trừ 2).
      // Cho ảnh cùng 8px như hộp thì đường cong hai lớp lệch nhau, nhìn ra
      // ngay dù không chỉ được tên.
      //
      // `overflow-hidden` ở đây thì được — thẻ này không nhô gì ra ngoài lúc
      // hover (chỉ đổi bóng và màu viền).
      className="group grid grid-cols-[7.5rem_1fr] items-stretch gap-0 overflow-hidden rounded-lg border border-dashed border-rule bg-paper p-0.5 shadow-card-off transition-[color,border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-hover)] hover:border-rule-strong hover:shadow-card sm:grid-cols-[13rem_1fr]"
    >
      <div className="relative aspect-[4/3] h-full w-full overflow-hidden rounded-l-md">
        <Media
          media={location.images[0]}
          locale={locale}
          fill
          // Thẻ nằm trong cột chữ rộng tối đa 900px trừ đệm; ô ảnh dừng ở 208px.
          sizes="(max-width: 640px) 120px, 208px"
          className="object-cover transition-transform duration-[var(--duration-base)] ease-[var(--ease-hover)] group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-2 p-4 sm:p-6">
        {/* Phân loại là một VIÊN PILL, không phải một dòng chữ trần.
            Trên nền trắng, một dòng chữ hoa nhỏ đọc ra như phần mở đầu của
            đoạn văn bên dưới; đóng khung nó lại thì nó tách hẳn ra thành nhãn
            phân loại. Số đo của Spots: cao 24px, bo 12px, đệm ngang 10px.
            Thành phố nối vào cùng viên đó thay vì xuống dòng riêng — nó là
            thông tin PHÂN BIỆT, không phải thông tin chính, và một dòng meta
            thứ hai sẽ đẩy tên địa điểm xuống thấp hơn cả ảnh trên thẻ hẹp. */}
        {/* Phân loại nằm TRONG viên pill, thành phố nằm NGOÀI.
            Nhồi cả hai vào một viên là hỏng trên điện thoại: cột chữ của thẻ
            chỉ rộng khoảng 165px ở máy 390px, nên "CHỢ VÀ MUA SẮM · QUẢNG CHÂU"
            xuống hai dòng trong khi viên pill bị khoá cao 24px — chữ tràn ra
            ngoài nền bo tròn và trông như lỗi dựng.
            Tách ra thì mỗi phần tự xuống dòng độc lập, và nó cũng đúng cách
            spotstravel.co làm: viên pill của họ chỉ chứa phân loại.

            `min-h-6` thay cho `h-6`: chiều cao vẫn 24px như đã đo bên họ, nhưng
            là chiều cao TỐI THIỂU — một phân loại dài tự xuống dòng thì viên
            pill cao lên theo thay vì cắt cụt chữ. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex min-h-6 items-center rounded-xl bg-ink-900 px-2.5 py-1 text-label uppercase text-ink-500">
            {t(`category.${location.category}`)}
          </span>
          {location.city && (
            <span className="text-label uppercase text-ink-500">{location.city}</span>
          )}
        </div>
        <h4 className="font-display text-d4 transition-colors duration-[var(--duration-base)] ease-[var(--ease-hover)] group-hover:text-accent">
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
