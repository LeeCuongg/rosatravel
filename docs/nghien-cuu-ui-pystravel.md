# Nghiên cứu UI tham khảo: pystravel.vn (trang chủ)

Ngày khảo sát: 14/09/2026 · Công cụ: Chrome DevTools (desktop 1440×900, mobile ~390–500px)

Mục đích: ghi lại **thành phần giao diện, thông số thiết kế và hiệu ứng tương tác** để làm cơ sở xây bộ frontend mới cho Rosa Travel.
Tài liệu chỉ ghi cấu trúc và thông số đo được. **Không** sao chép nội dung chữ, hình ảnh, logo hay bộ nhận diện của PYS Travel. Khi dựng, dùng nội dung và thương hiệu của Rosa Travel.

Ký hiệu độ tin cậy:
- ✅ **Đã kiểm chứng**: hover/click thật trên trình duyệt và đọc computed style.
- 📄 **Theo CSS**: suy ra từ class Tailwind và rule CSS có trên trang, chưa thao tác trực tiếp.

---

## 1. Tổng quan kỹ thuật

| Hạng mục | Quan sát |
|---|---|
| Framework | Next.js App Router (`/_next/static/chunks/app/...`) |
| CSS | Tailwind CSS (utility class, breakpoint mặc định) + vài CSS module (`home_featured-tours__*`) |
| Font | **Inter** (variable 100–900, qua `next/font`) là font chính của UI. Roboto là font body mặc định. Open Sans chỉ có trong widget chat |
| Slider | `react-slick` (có CSS `.slick-*`) + các track cuộn ngang dùng `scroll-snap` |
| Cỡ chữ gốc | `body` 13px. Thang Tailwind đã tùy biến: `text-lg` = 16px, `text-xl` = 18px |
| Chiều cao trang chủ | ~7.700px (desktop 1440) |

---

## 2. Design tokens

### 2.1 Màu

| Token (tên trên site) | Giá trị | Dùng cho |
|---|---|---|
| `tertiary` | `#FF5B00` | CTA chính (Tìm tour, Đăng ký), giá bán, menu đang active, gạch chân hover menu, sao đánh giá |
| `primary-v2` | `#1F50EA` | Link "Xem thêm", dot slider active, nền khối newsletter, icon phụ |
| `primary` | `#00759A` | Ring focus |
| `primary-light` | `#0099CC` | Phụ |
| `secondary` | `#00506C` | Text hover phụ |
| `secondary-v2` | `#242424` | **Màu chữ chính** (heading, nav, tiêu đề thẻ) |
| Muted text | `#828282` | Meta (đánh giá, số ngày, điểm đi, giá gốc gạch ngang, ngày đăng) |
| `neutral-90` | `#F2F2F2` | Nền footer, nền ô tìm kiếm ở header sticky |
| `neutral-70` | `#E0E0E0` | Chip gợi ý, dot slider chưa active |
| `neutral-200` | `#E5E5E5` | Viền |
| Nền section "xu hướng" | `#FFEFE5` + ảnh pattern | Dải danh mục xu hướng |
| Nền panel gợi ý | `#FCF9F9` | Dropdown tìm kiếm |
| Chat widget | `#1E78BD` | Nút chat nổi |

> Với Rosa Travel: giữ **cấu trúc vai trò màu** (1 màu CTA nóng, 1 màu link/nhấn lạnh, chữ chính gần đen, chữ phụ xám, 2 mức nền xám nhạt), còn giá trị thì thay bằng màu thương hiệu riêng.

### 2.2 Typography (Inter)

| Vai trò | Desktop | Mobile |
|---|---|---|
| Tiêu đề section (H2) | 26px / 39px / 700 | 20px / 500 |
| H2 khối USP | 20px / 30px / 400 | 20px |
| Tiêu đề thẻ tour (H3) | 16px / 24px / 600, `line-clamp-2` (lg: 3) | như desktop |
| Menu chính | 14–16px / 600 | — |
| Giá bán | 18px / 27px / 700, màu CTA | như desktop |
| Giá gốc | 12px, gạch ngang, xám | như desktop |
| Meta | 12px / 18px / 400, xám | như desktop |
| Link "Xem thêm" | 16px / 400, màu nhấn | ẩn chữ, chỉ còn icon |
| Input / button | 16px, button 600 | như desktop |

### 2.3 Bo góc, đổ bóng, khoảng cách

| Token | Giá trị | Dùng cho |
|---|---|---|
| `rounded-xl` | 12px | Thẻ tour, button, input, ô điểm đến |
| `rounded-2xl` | 16px | Banner hero, panel dropdown, ảnh blog, khối newsletter, mega menu |
| `rounded-full` | 9999px | Chip, pill menu active, nút mũi tên slider, dot |
| Bóng nav | `shadow-lg` (0 10px 15px -3px / 0 4px 6px -4px, α .1) | Header |
| Bóng thẻ | `drop-shadow-md` (filter) | Thẻ tour |
| Bóng panel | `shadow-2xl` (0 25px 50px -12px α .25) | Panel gợi ý tìm kiếm |
| Bóng thanh liên hệ mobile | 0 4px 20px α .3 | Bottom bar |
| Container | `container mx-auto px-5 lg:max-w-[85%] 2xl:max-w-screen-xl lg:px-0` | Mọi section (1440 → nội dung rộng 1211px) |
| Nhịp dọc section | `py-8 lg:py-14`, `space-y-8 lg:space-y-14` | |
| Khoảng cách thẻ trong carousel | `mr-4 lg:mr-6 2xl:mr-8` | |

### 2.4 Chuyển động

| Token | Giá trị | Dùng cho |
|---|---|---|
| Mặc định | 150ms `cubic-bezier(.4,0,.2,1)` | Nâng thẻ, panel gợi ý, drawer |
| Chậm | 500ms cùng easing | Gạch chân menu, dot slider, tab mega menu, header sticky |
| Rất chậm | 1000ms | Zoom ảnh điểm đến |
| Chat | 300ms | Nút chat |

### 2.5 Z-index và breakpoint

- z-index: nút nổi `10` · nav `30` · thanh tìm kiếm sticky `40` · drawer / header trượt mobile / mega menu `50` (nội dung mega menu `60`).
- Breakpoint: Tailwind mặc định `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`, thêm `min 390` và vài `max-width` 480/767/768. **`lg` (1024) là ranh giới desktop/mobile** của hầu hết thành phần.

---

## 3. Bố cục trang chủ (thứ tự từ trên xuống)

| # | Section | Vị trí Y (desktop) | Cao | Ghi chú |
|---|---|---|---|---|
| 1 | Header / Nav | 0 | 91 | Sticky, có mega menu |
| 2 | Hero banner slider | 107 | 488 | 3 slide, ảnh bo 16px |
| 3 | Thanh tìm kiếm | đè mép dưới hero | 64 | Lên sticky khi cuộn |
| 4 | Dải USP / thống kê | 659 | 112 | `-translate-y-8` kéo lên sát hero |
| 5 | Khuyến mãi (banner ngang) | 843 | 247 | 4 ảnh 393×192 |
| 6 | Danh mục xu hướng | 1130 | 269 | Nền cam nhạt + pattern |
| 7 | 4 carousel tour | 1399 | 2164 | Trong nước / Nước ngoài theo mùa, HOT trong nước / nước ngoài |
| 8 | Đánh giá khách hàng + Logo doanh nghiệp | 3563 | 915 | |
| 9 | Khám phá Việt Nam + Vi vu nước ngoài | 4478 | 1270 | Lưới mosaic |
| 10 | Cẩm nang du lịch + Bản tin | 5748 | 695 | 2 cột |
| 11 | Báo chí nói về chúng tôi | 6443 | 267 | 3 thẻ |
| 12 | Newsletter CTA | 6710 | 386 | Khối xanh bo góc |
| 13 | Footer | 7096 | 596 | |
| — | Nút nổi, widget chat, bottom bar mobile | fixed | — | |

---

## 4. Danh mục thành phần

### 4.1 Header / Nav (desktop)
- **Cấu trúc:** logo trái · menu giữa (5 mục) · phải: số hotline (icon + chữ đậm), link giới thiệu, chọn ngôn ngữ (cờ tròn + chevron).
- **Spec:** nền trắng, `px-10 2xl:px-16`, cao 91px, `shadow-lg`, chữ `#242424`.
- **Mục đang nổi bật:** pill `bg-tertiary text-white rounded-full px-2 py-1 font-semibold`.
- **Hover mục menu** ✅: một vạch cao 2px màu CTA dưới mục chạy từ `scale-x-0` lên `scale-x-100`, gốc biến đổi ở giữa, 500ms (`transition-transform duration-500`). Kết quả là gạch chân "mọc" từ giữa ra hai bên.
- **Hover link con** 📄: `hover:underline`.

### 4.2 Mega menu ✅
- **Mở ra:** khi hover mục menu (cấu trúc `.group`). Panel đặt `absolute` full-width dưới nav, `pt-2`.
- **Khung:** `bg-white border drop-shadow-md rounded-2xl`, rộng container (1280), cao 456px.
- **Cột trái** (`w-64 border-r divide-y`): danh sách tab gồm tiêu đề vùng (semibold) và một dòng link con xám bên dưới. **Tab active** có nền CTA, chữ trắng. Đổi tab khi hover, màu chuyển trong 500ms (`transition-colors duration-500`). Góc trên/dưới của tab đầu/cuối bo theo panel.
- **Vùng phải:** carousel thẻ tour (dùng chung component Tour card, xem 4.10) với nút mũi tên tròn hai bên.
- ⚠️ Panel **hiện/ẩn tức thời**, không có animation. Rosa Travel yêu cầu mọi lớp phủ phải có animation vào **và thoát**, nên khi dựng cần thêm fade + slide nhẹ.

### 4.3 Header sticky thu gọn (desktop, khi cuộn) ✅
- Hiện khi cuộn qua hero: thanh trắng cao 88px, `shadow-lg`. Logo trái, **ô tìm kiếm ở giữa**, hotline phải.
- Xuất hiện bằng keyframe `sticky-header-anim` (0,5s: width 0 → 50% → 100%) kết hợp translate.

### 4.4 Header, drawer và bottom bar (mobile)
- **Header** 📄✅: cao 64px, sticky, logo trái, nút hamburger 24px phải.
- **Header trượt:** bản `fixed` riêng dùng keyframe `slideInDown` / `slideOutUp` (hiện khi cuộn lên, ẩn khi cuộn xuống).
- **Drawer menu** ✅: `fixed inset-0 bg-white z-50`, trạng thái đóng `translate-x-full`, trượt vào từ phải trong 150ms. Mỗi mục: `px-5 py-4 border-b text-xl font-medium` + chevron (dạng accordion).
- **Bottom contact bar** ✅: `fixed bottom-0 h-14 grid grid-cols-3 divide-x` nền trắng, bóng 0 4px 20px α .3, gồm 3 nút icon (gọi / Zalo / chat). Footer thêm `pb-16` để không bị bar che.

### 4.5 Hero banner slider ✅
- 1211×488 (desktop), ảnh `lg:rounded-2xl`. Mobile full-width, cao ~196px, không bo góc.
- **Mũi tên:** nút tròn trắng ~40px có bóng, đặt **ngoài** mép banner (trái/phải).
- **Dot:** chưa active là chấm tròn 6px `#E0E0E0`; active là pill rộng 16px màu nhấn, chuyển trong 500ms.
- Mỗi slide là một link ảnh (banner dựng sẵn chữ trong ảnh).
- Mobile ✅: không có mũi tên, dot nằm **trong** banner ở đáy giữa, vuốt để chuyển slide.

### 4.6 Thanh tìm kiếm ✅
- **Desktop:** nằm đè mép dưới hero, một hàng ngang: nền trắng, bóng, `rounded-xl`, cao 64px, `px-6 gap-2`.
- Gồm icon định vị, input (`text-lg`, không viền, `focus:ring-0 focus:outline-none`), nút **Tìm tour** (`bg-tertiary text-white rounded-xl px-6 py-3 font-semibold` + icon kính lúp, cao 48px).
- **Mobile** ✅: là một thẻ trắng bo 16px có bóng, đè lên đáy hero. Bên trong xếp dọc: hàng input ở trên, nút **Tìm tour** `w-full` cao ~52px ở dưới. Panel gợi ý mở ngay dưới thẻ, chip và list cuộn ngang.

### 4.7 Panel gợi ý tìm kiếm ✅ (mở khi focus input)
- `absolute lg:top-12 p-8 bg-[#fcf9f9] shadow-2xl rounded-2xl z-10`, rộng bằng container.
- **Animation:** `transition` 150ms từ `scale-0` sang `scale-100`.
- **Nội dung:**
  1. Hàng chip gợi ý: `bg-neutral-70 px-3 py-2 rounded-full font-semibold`.
  2. Hai cột, mỗi cột có tiêu đề ~24px bold:
     - "Tour được tìm nhiều nhất": list gồm thumbnail 100×100 bo nhẹ, tiêu đề 16px semibold (line-clamp), icon đồng hồ + số ngày, dòng "Chỉ từ" + giá màu CTA đậm.
     - "Điểm đến nổi bật": cùng cấu trúc.

### 4.8 Dải USP / thống kê
- **Desktop:** trái là badge số năm + H2 20px + dòng phụ 12px xám; vạch chia dọc; phải là lưới 2×2 các mục "icon trong vòng tròn nền xanh nhạt + text 16px".
- **Mobile:** xếp dọc, cao ~313px.

### 4.9 Section header (dùng lại ở mọi section)
- Trái: (tùy chọn) icon tia sét màu vàng/CTA + H2 26px bold.
- Phải: link "Xem thêm" màu nhấn + icon mũi tên trong vòng tròn đặc màu nhấn.
- **Hover** 📄: cả nhóm dùng `.group`, chữ link `group-hover:underline group-hover:font-medium group-hover:text-lg` (16px). Không có transition.
- Mobile: chữ "Xem thêm" ẩn (`hidden lg:inline`), chỉ còn icon.

### 4.10 Tour card ✅ (thành phần quan trọng nhất)
```
┌──────────────────────────┐  rounded-xl, bg-white, drop-shadow-md
│  ẢNH  h-200 object-cover │  rounded-t-xl
├──────────────────────────┤
│ Tiêu đề 16/600 clamp 2–3 │
│ ★ 4.9 (315) | 2100+ đã đặt│  12px xám, sao màu CTA
│ ──────────────────────── │  divider
│ ⏱ 3 ngày 2 đêm   ̶3̶.̶4̶9̶8̶.̶0̶0̶0̶đ̶ │  icon màu nhấn · giá gốc gạch ngang
│ 📍 Điểm đi: Hà Nội 3.180.000đ│  giá bán 18/700 màu CTA
└──────────────────────────┘
```
- Desktop: rộng ~300px (`lg:min-w-72`, `basis-1/4` → 4 thẻ/khung nhìn), cao ~376px. Mobile: `w-60` (240px), cuộn ngang `snap-x snap-mandatory`.
- **Hover** ✅: thẻ nhấc lên 8px (`hover:-translate-y-2`), transition 150ms. Bóng giữ nguyên.
- **Carousel:** nút mũi tên tròn trắng ngoài mép container. Nút ở biên có trạng thái `disabled`.

### 4.11 Promo banner row
- Hàng ngang 4 ảnh ~393×192, bo góc. Mobile cuộn ngang, `no-scrollbar`.

### 4.12 Danh mục xu hướng
- Section có nền màu nhạt + ảnh pattern, `py-8 2xl:py-10`.
- Tile 150×150 `rounded-2xl object-cover`, nhãn chữ trắng đè lên ảnh. Cuộn ngang trên mobile.

### 4.13 Thẻ đánh giá khách hàng + carousel
- Cấu trúc thẻ: hàng 5 sao · "Đánh giá" + tên tour (link màu nhấn, clamp) · đoạn trích (clamp nhiều dòng) · avatar tròn 64px + tên + địa chỉ (xám).
- Carousel 4 thẻ/khung, mũi tên hai bên (có `disabled`). Bên dưới là link "Xem thêm N+ đánh giá" có `hover:underline`.

### 4.14 Logo khách hàng doanh nghiệp
- Section header + hàng logo (ảnh ~128px) link sang bài chi tiết.

### 4.15 Lưới điểm đến (mosaic) ✅📄
- `grid grid-cols-12 gap-4`, mỗi hàng cao 240px. `col-span` đo được theo thứ tự: 5 · 4 · 3 · 2 · 3 · 3.
- Tile: `relative block rounded-xl overflow-clip`, ảnh `object-cover`, nhãn `absolute left-6 bottom-6 text-white text-xl` (mobile `left-3 bottom-3`). **Không có lớp gradient phủ**, nên khi dựng nên thêm để chữ trắng dễ đọc.
- **Hover** 📄: ảnh `hover:scale-110 transition duration-1000`, zoom chậm 1 giây trong khung bị cắt.
- **Mobile:** lưới cố định `w-[800px]` đặt trong track `overflow-x-auto snap-x`, tile cao `h-36`.

### 4.16 Blog + Bản tin (2 cột)
- **Cẩm nang (trái):** lưới thẻ gồm ảnh `aspect-[3/2] rounded-2xl mb-2`, tiêu đề, ngày. Mobile `w-60` cuộn ngang.
- **Bản tin (phải):** list gọn gồm thumbnail nhỏ ~128px, tiêu đề, ngày.

### 4.17 Báo chí
- 3 thẻ ngang: ảnh + tiêu đề + ngày, header có link "Xem toàn bộ".

### 4.18 Newsletter CTA ✅
- Khối `lg:rounded-2xl lg:px-16 lg:py-12 lg:h-[290px]`, nền màu nhấn + ảnh trang trí `bg-right-bottom bg-no-repeat`, chữ trắng.
- Gồm tiêu đề lớn, dòng phụ, form: input `bg-white rounded-xl px-5 py-3.5 lg:w-[350px]` (cao 52px) + nút `bg-tertiary rounded-xl lg:px-10 font-semibold`, và ảnh minh họa người ở bên phải.
- Có validate số điện thoại (thông báo lỗi dạng aria).

### 4.19 Footer
- Nền `#F2F2F2`, `text-lg`. 4 cột desktop:
  1. Logo + tên công ty + giấy phép (list bullet).
  2. "Hoạt động": link.
  3. "Thông tin hữu ích": link.
  4. "Thông tin liên lạc": trụ sở, văn phòng, hotline, email (có icon).
- Link `text-secondary-v2 hover:underline` 📄.
- Hàng đáy: copyright · 7 icon mạng xã hội tròn · badge chứng nhận.
- Mobile: xếp dọc, `pb-16`.

### 4.20 Nút nổi & widget chat (desktop)
- **Cụm nút** `fixed bottom-24 right-6 space-y-4`: nút gọi (tròn, nền CTA) + nút Zalo (tròn viền).
- **Nút chat** ✅: tròn 60px `#1E78BD`, bóng màu, animation `chatButtonPulse` 2s lặp (bóng đập nhịp).
  - Hover: `scale(1.05)` + bóng lớn hơn (300ms). Active: `scale(.95)`.
- **Thẻ chào** (greeting card): hiện cạnh nút, có tiêu đề, lời chào, nút "Gửi tin nhắn", nút ✕.
  - Hover thẻ: `translateY(-2px)` + bóng đậm hơn.
  - Hover nút gửi: `translateY(-1px)` + bóng xanh.
  - Hover ✕: nền đỏ nhạt, chữ đỏ, `scale(1.05)`.
  - Vào/ra bằng `chatSlideIn` / `chatSlideOut` (opacity + translateY 20px + scale .95).

---

## 5. Bảng tổng hợp tương tác

| Thành phần | Trigger | Hiệu ứng | Thời lượng | Nguồn |
|---|---|---|---|---|
| Mục menu | hover | Vạch 2px CTA `scaleX 0→1` từ giữa | 500ms | ✅ |
| Mega menu | hover mục | Hiện panel (tức thời) | — | ✅ |
| Tab mega menu | hover | Nền chuyển sang CTA, chữ trắng | 500ms | ✅ |
| Link con / footer / "xem thêm đánh giá" | hover | underline | — | 📄 |
| "Xem thêm" section | hover nhóm | underline + medium + 16px | — | 📄 |
| Tour card | hover | `translateY(-8px)` | 150ms | ✅ |
| Ảnh điểm đến | hover | `scale(1.1)` | 1000ms | 📄 |
| Ô tìm kiếm | focus | Panel gợi ý `scale 0→1` | 150ms | ✅ |
| Input | focus | Bỏ outline/ring (một số form: viền `#80bdff` / màu nhấn / CTA) | — | 📄 |
| Dot slider | đổi slide | 6px tròn ↔ pill 16px | 500ms | ✅ |
| Header desktop | cuộn | Header sticky thu gọn, có ô tìm kiếm | 500ms | ✅ |
| Header mobile | cuộn lên/xuống | `slideInDown` / `slideOutUp` | — | 📄 |
| Drawer mobile | bấm hamburger | `translateX(100%→0)` | 150ms | 📄 |
| Modal | mở/đóng | Backdrop opacity 0→.4 / 1→0 · `modalSlideInDown` / `modalSlideOutUp` | — | 📄 |
| Nút chat | idle / hover / active | pulse 2s · scale 1.05 · scale .95 | 300ms | ✅ |
| Button chung (utility có sẵn) | hover | `bg-tertiary/90`, `bg-primary-v2/90`, `opacity-90`, `shadow-md/lg/xl`, `scale-105` | 150ms | 📄 |

**Keyframes có trên site:** `bounce`, `pulse`, `spin` (Tailwind) · `sticky-header-anim` · `slideInDown` / `slideOutUp` · `modalBackdropFadeIn` / `FadeOut` · `modalSlideInDown` / `SlideOutUp` · `chatButtonPulse` · `chatSlideIn` / `chatSlideOut`.

---

## 6. Khác biệt desktop / mobile (ranh giới `lg` 1024px)

- Mọi carousel tour, blog, danh mục, điểm đến trên mobile đổi thành **track cuộn ngang** `overflow-x-auto snap-x snap-mandatory no-scrollbar`, thẻ rộng cố định (`w-60`).
- Menu ngang đổi thành hamburger + drawer toàn màn hình. Nút nổi desktop ẩn, thay bằng bottom contact bar 3 cột.
- Hero bỏ bo góc. Chữ "Xem thêm" ẩn, chỉ còn icon. H2 giảm từ 26px xuống 20px.

---

## 7. Điểm yếu quan sát được (không nên lặp lại)

1. **Mega menu không có animation vào/ra**: trái yêu cầu "animation phải mượt, có animation thoát" của Rosa Travel.
2. **Hover "Xem thêm" đổi `font-weight` và `font-size`** làm chữ nhảy layout. Nên dùng underline hoặc dịch icon mũi tên.
3. **Thiếu nhãn a11y:** nút mũi tên slider, icon mạng xã hội, nút hamburger không có `aria-label`. Ảnh thẻ tour có `alt="title"`.
4. **Link bị trùng:** mỗi thẻ có 2–3 link cùng URL (ảnh, tiêu đề, giá), khiến người dùng bàn phím và trình đọc màn hình phải đi qua lặp lại.
5. **Lỗi dữ liệu hiển thị:** có thẻ ra "NaN+ đã đặt chỗ" và thiếu số lượt đánh giá. Cần fallback khi dữ liệu trống.
6. **Ảnh điểm đến không có gradient phủ**, nên chữ trắng khó đọc trên ảnh sáng.
7. Không thấy xử lý `prefers-reduced-motion` cho zoom 1s, pulse và nhấc thẻ.
8. Body 13px, thang chữ bị tùy biến lệch (`text-lg` = 16px) dễ gây nhầm khi code. Nên đặt tên token rõ nghĩa.

---

## 8. Đề xuất cho bộ frontend Rosa Travel

**Tokens** (Tailwind theme / CSS variables):
- Màu: `color-cta`, `color-accent`, `color-text`, `color-text-muted`, `color-surface-1`, `color-surface-2`, `color-border`.
- Bo góc: `radius-md 12`, `radius-lg 16`, `radius-pill`.
- Bóng: `shadow-card`, `shadow-panel`, `shadow-header`.
- Chuyển động: `duration-fast 150`, `duration-base 300`, `duration-slow 500`, `duration-zoom 1000`, một easing chung `cubic-bezier(.4,0,.2,1)`.

**Thứ tự dựng component** (ưu tiên trên xuống):
1. `Container`, `SectionHeader` (có link xem thêm), `Button` (cta / accent / ghost), `Chip`, `Price` (giá gốc + giá bán)
2. `TourCard` + `Carousel` (desktop có mũi tên, mobile snap scroll)
3. `Header` desktop + `MegaMenu` (**có enter/exit animation**) + `StickyHeader`
4. `MobileHeader` + `Drawer` (có exit animation) + `BottomContactBar`
5. `HeroSlider` + `SearchBar` + `SearchSuggestPanel` (có exit animation)
6. `UspBar`, `CategoryTile`, `DestinationMosaic` (thêm gradient, zoom 1s)
7. `ReviewCard`, `LogoStrip`, `BlogCard`, `NewsListItem`, `PressCard`
8. `NewsletterCta`, `Footer`, `FloatingContact` / `ChatWidget`

**Nguyên tắc tương tác** giữ lại từ site tham khảo: nhấc thẻ 8px, gạch chân menu mọc từ giữa, zoom ảnh chậm, dot slider dạng pill. Bổ sung: exit animation cho mọi lớp phủ, `focus-visible` rõ ràng, `prefers-reduced-motion`.
