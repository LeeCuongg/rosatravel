import type { ReactNode } from 'react'

/**
 * KHUNG NÉT ĐỨT + NHÃN — primitive bố cục dùng lại cho MỌI khối trên site.
 *
 * Đây là chi tiết chữ ký của toàn bộ thiết kế, lấy từ spotstravel.co: mỗi khối
 * nội dung nằm trong một khung viền nét đứt 1px, và tên khối là một dòng chữ
 * hoa nhỏ nằm trong dải riêng phía trên, ngăn bằng chính đường nét đứt đó.
 *
 * Vì sao phải là primitive chứ không copy class ở từng section: cảm giác "tạp
 * chí" chỉ xuất hiện khi MỌI khung dùng chung một độ dày, một màu, một khoảng
 * đệm. Chỉ cần một section lệch 1px hoặc lệch màu là mắt đọc ra ngay và cả hệ
 * thống trông như dựng tạm.
 *
 * Ba lựa chọn bề rộng ứng với ba loại nội dung, không được chọn bừa:
 *   sml (900px)  — chữ dài để đọc. Rộng hơn là mỗi dòng quá nhiều chữ, mắt
 *                  lạc dòng khi xuống hàng.
 *   med (1200px) — lưới ảnh, bảng, biểu mẫu. Mặc định.
 *   lge (1800px) — dải ảnh lớn cần thoáng.
 */
const WIDTHS = {
  sml: 'max-w-sml',
  med: 'max-w-med',
  lge: 'max-w-lge',
} as const

/**
 * Hai sắc thái nền cho khung.
 *
 *   trong — mặc định. Khung chỉ có viền, nền là nền trang (kem). Dùng cho
 *           MỌI khối kể chuyện: chúng là một phần của trang.
 *   giay  — nền trắng, bo 16px. Dành cho khối cần tách hẳn khỏi mạch đọc, và
 *           trên site này chỉ có ĐÚNG MỘT khối như vậy: biểu mẫu ở cuối trang.
 *           Nền trắng nói "chỗ này không phải để đọc, là để điền".
 *
 * Spots dùng đúng cách chia này — đã đo: khối thẻ hành trình nền kem
 * (#fef9eb), riêng khối liên hệ nền trắng, bo 16px, đệm 80px. Đừng thêm sắc
 * thái thứ ba; hai đã đủ để phân biệt "đọc" với "làm".
 *
 * Bán kính nằm TRONG bảng này, không để `rounded-lg` ở chuỗi class gốc rồi
 * mong `rounded-2xl` đè lên. Thứ tự trong chuỗi class không quyết định gì cả —
 * trình duyệt theo thứ tự trong file CSS, mà Tailwind tự sắp các tiện ích theo
 * thang của nó. Đã đo: khung vẫn ra 8px trong khi bảng này khai 16px. Cách duy
 * nhất chắc chắn là mỗi sắc thái tự khai đủ bán kính của mình, không chồng lấn.
 */
const TONES = {
  trong: 'rounded-lg',
  giay: 'rounded-2xl bg-paper',
} as const

interface FrameProps {
  children: ReactNode
  /** Nhãn chữ hoa nhỏ ở dải trên cùng. Bỏ trống thì khung không có dải nhãn. */
  label?: string
  width?: keyof typeof WIDTHS
  tone?: keyof typeof TONES
  /** Class thêm cho vùng nội dung bên trong khung (không phải cho khung). */
  bodyClassName?: string
  /** Đặt id để liên kết neo (#...) nhảy tới được. */
  id?: string
}

export function Frame({
  children,
  label,
  width = 'med',
  tone = 'trong',
  bodyClassName = 'p-8 sm:p-12',
  id,
}: FrameProps) {
  return (
    // KHOẢNG NGHỈ GIỮA CÁC KHỐI PHẢI LÀ `my-`, KHÔNG ĐƯỢC LÀ `py-`.
    //
    // Đây không phải chuyện sở thích. Lề dọc của hai phần tử anh em GỘP LẠI
    // (margin collapsing): 125px dưới khối này gặp 125px trên khối kia thì kết
    // quả là 125px, đúng một khoảng nghỉ. Đệm thì KHÔNG gộp — hai khối cạnh
    // nhau cho ra 250px, và cả trang rời rạc ra thành những mảnh trôi nổi.
    //
    // Đã đo cả hai bên: spotstravel.co đặt `margin: 125px 0` lên mọi section và
    // khoảng cách thật giữa chúng đúng 125px. Bản `py-section` cũ của mình cho
    // ra 250px — gấp đôi, và đó chính là cảm giác "cách nhau xa quá".
    <section id={id} className="px-gutter my-section">
      {/* Bo 8px cho MỌI hộp nét đứt trên site.
          Thang bo góc lấy nguyên của spotstravel.co, đã đo trong CSS của họ:
          --br-1: 4px (ô nhập), --br-2: 8px (thẻ và khung), --br-3: 16px (khối
          đổ nền). Ba mốc đó trùng đúng với `rounded` / `rounded-lg` /
          `rounded-2xl` mặc định của Tailwind, nên không cần khai token riêng —
          nhưng phải dùng ĐÚNG ba mốc này, đừng chế thêm mốc thứ tư.

          KHÔNG đặt `overflow-hidden` để cắt gọn góc: thẻ trong lưới "Chuyến đã
          đi" nhô bóng đổ ra ngoài khi hover, và cắt sẽ xén phần bóng đó thành
          một đường thẳng ngay mép khung. Các vách ngăn bên trong đều nằm sâu
          trong lòng hộp nên không có gì thò ra ở góc cong. */}
      <div className={`mx-auto ${WIDTHS[width]} border border-dashed border-rule ${TONES[tone]}`}>
        {label && (
          <div className="border-b border-dashed border-rule px-6 py-4 text-center">
            <Eyebrow>{label}</Eyebrow>
          </div>
        )}
        <div className={bodyClassName}>{children}</div>
      </div>
    </section>
  )
}

/**
 * Nhãn chữ hoa nhỏ. Luôn dùng font sans (KHÔNG serif) — sự tương phản giữa
 * nhãn sans bé xíu và tiêu đề serif khổng lồ chính là thứ tạo nhịp cho trang.
 * Cỡ và độ giãn chữ nằm trong token `text-label`, đừng ghi đè tại chỗ.
 */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-sans text-label text-ink-500 uppercase ${className}`}>{children}</p>
  )
}

/**
 * Đường kẻ ngang nét đứt, dùng để ngăn các hàng bên TRONG một khung.
 *
 * Dùng `<div role="separator">` chứ không phải `<hr>`: đường này thuần trang
 * trí, còn `<hr>` mang ngữ nghĩa "chuyển chủ đề" và bị trình đọc màn hình đọc
 * lên. Một trang có hai chục cái `<hr>` là hai chục lần ngắt lời vô nghĩa.
 */
export function Rule({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`border-t border-dashed border-rule ${className}`} />
}
