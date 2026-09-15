# Kế hoạch triển khai Rosa Travel (bản mới)

Cơ sở:
- [nghien-cuu-ui-pystravel.md](nghien-cuu-ui-pystravel.md): thành phần, bố cục và hiệu ứng tham khảo.
- [DESIGN-zapier.md](DESIGN-zapier.md): **hệ thống thiết kế chính thức** (màu, chữ, bo góc, button, card).
- [brand/](brand/): logo Rosa Travel.
- Env đã giữ: `MONGODB_URI`, `PAYLOAD_SECRET`, `BLOB_*`, `NEXT_PUBLIC_SITE_URL`.

**Đã chốt (14/09/2026):**

| Quyết định | Kết quả |
|---|---|
| Đặt tour | **Chỉ nhận yêu cầu đặt tour**, sales liên hệ lại. Không thanh toán online ở bản đầu |
| Ngôn ngữ | **Launch tiếng Việt**. Kiến trúc đa ngôn ngữ từ đầu, về sau khách tự chọn ngôn ngữ |
| Thiết kế | Theo **DESIGN-zapier.md** (điều chỉnh cho du lịch, xem mục 2.1) |
| Logo | Tạo mới: ghim bản đồ + hồng dại 5 cánh (`docs/brand/`), chờ chủ dự án duyệt |
| Kênh liên hệ nổi | **Zalo, Facebook, Messenger, Instagram, Threads** |
| Dữ liệu cũ | Đã xóa toàn bộ. Bản mới dùng db riêng |

---

## 0. Nguyên tắc số 1: admin tự sửa nội dung, không phải sửa code

Yêu cầu của chủ dự án (14/09/2026): **nội dung tour (và mọi nội dung khách nhìn thấy) phải chỉnh được trong admin**, không phải nhờ dev sửa code.

### 0.1 Quy tắc cho dev
- **Không viết cứng nội dung vào code**: tên tour, giá, lịch trình, ảnh, banner, menu, số điện thoại, link mạng xã hội, chính sách, nội dung SEO. Code chỉ quyết định *cách hiển thị*.
- Làm một phần hiển thị mới thì **tạo field/khối trong admin trước**, rồi mới dựng component đọc dữ liệu từ đó.
- Chỉ nhãn giao diện cố định (vd. "Đặt tour", "Xem thêm") được nằm trong `src/i18n/messages/vi.json`. Khi review, gặp chuỗi nội dung tiếng Việt viết thẳng trong JSX thì coi là lỗi.

### 0.2 Tour: nhân viên tự sửa được những gì

| Nhóm | Sửa được trong admin |
|---|---|
| Thông tin chung | Tên, slug (tự sinh từ tên, sửa được), mã tour, ảnh bìa, gallery (kéo thả sắp xếp), số ngày/đêm, điểm khởi hành, điểm đến, danh mục, nhãn HOT / xu hướng, trạng thái hiển thị |
| Giá & lịch khởi hành | Giá gốc, giá bán; bảng ngày khởi hành gồm giá từng ngày, số chỗ còn, trạng thái (còn chỗ / sắp hết / hết) |
| **Nội dung trang tour dạng khối** | Nhân viên tự **thêm, xóa, kéo thả thứ tự** các khối: Điểm nổi bật · Lịch trình theo ngày (tiêu đề ngày, bữa ăn, nội dung, ảnh) · Bao gồm / Không bao gồm · Bảng giá chi tiết · Chính sách hủy/đổi · Lưu ý · Câu hỏi thường gặp · Ảnh / Video · Văn bản tự do |
| SEO | Tiêu đề, mô tả, ảnh chia sẻ mạng xã hội |
| Liên kết | Tour liên quan (chọn tay, hoặc để trống thì tự gợi ý theo điểm đến) |

### 0.3 Cơ chế hỗ trợ nhân viên
- **Nháp và xuất bản** (Payload versions + drafts + autosave): sửa thoải mái, bấm **Xuất bản** mới lên site. Xem được và khôi phục được phiên bản cũ.
- **Xem trước (Live Preview)** ngay trong admin trước khi xuất bản.
- **Lên site sau vài giây** nhờ revalidate khi xuất bản, không cần build lại.
- **Hẹn giờ xuất bản / hết hạn** cho banner và khuyến mãi.
- **Báo lỗi ngay trong form** (thiếu ảnh bìa, giá ≤ 0, slug trùng…) để nhân viên tự sửa.
- **Phân quyền**: `editor` sửa nội dung; `sales` chỉ xử lý yêu cầu đặt tour.

### 0.4 Ngoài tour, cũng sửa được trong admin
Trang chủ (các section dạng khối, đổi thứ tự, chọn tour cho từng carousel) · menu và mega menu · footer · banner · điểm đến · danh mục · blog · đánh giá khách · trang tĩnh như giới thiệu, chính sách (dạng khối) · hotline, email, 5 kênh liên hệ.

### 0.5 Ranh giới
- **Không cần dev:** thêm/sửa/xóa tour · đổi giá · thêm ngày khởi hành · đổi thứ tự khối trên trang tour hoặc trang chủ · thay banner · đổi hotline/Zalo/email · thêm trang chính sách mới.
- **Vẫn cần dev:** thêm một *loại khối mới* chưa có (vd. bản đồ tương tác) · đổi thiết kế giao diện · thêm tính năng mới (vd. thanh toán).

---

## 1. Kiến trúc tổng thể

**Một app Next.js duy nhất, trong đó Payload CMS nhúng chung tiến trình** (frontend + admin + API cùng một repo, cùng một lần deploy lên Vercel).

```
Người dùng ──> Next.js (App Router, Vercel)
                 ├─ /[locale]/...      Trang public: SSG/ISR, đọc dữ liệu qua Payload Local API
                 ├─ /(payload)/admin   Trang quản trị cho nhân viên nhập tour, bài viết, banner
                 ├─ /(payload)/api     REST/GraphQL do Payload sinh sẵn
                 └─ Server Actions     Gửi yêu cầu đặt tour, tư vấn, đăng ký nhận ưu đãi
                        │
          ┌─────────────┼──────────────┐
      MongoDB Atlas   Vercel Blob     Resend
      (dữ liệu)       (ảnh)           (email báo yêu cầu đặt tour)
```

**Vì sao không tách backend riêng:** site chỉ nhận yêu cầu đặt tour, không có thanh toán. Payload đã có sẵn admin, phân quyền, upload ảnh, đa ngôn ngữ nội dung, API và hook. Chỉ nên tách khi thêm thanh toán online, app mobile, hoặc tích hợp hệ thống điều hành tour/CRM.

---

## 2. Frontend

| Hạng mục | Chọn | Lý do |
|---|---|---|
| Framework | **Next.js App Router + React 19 + TypeScript** | SEO tốt (SSG/ISR), cùng stack với Payload 3 |
| Phiên bản Next | Bản ổn định mới nhất **mà Payload 3 hỗ trợ chính thức** (kiểm tra lúc init) | Lệch phiên bản là nguồn lỗi hay gặp nhất |
| Styling | **Tailwind CSS v4**, token lấy từ DESIGN-zapier.md khai trong `@theme` | Một nguồn token duy nhất |
| Font | **Be Vietnam Pro** (display, 500/600/700) + **Inter** (body, UI) qua `next/font`, subset `vietnamese` | Degular Display là font độc quyền và không có dấu tiếng Việt. Be Vietnam Pro có tỷ lệ ấm, dựng dấu tiếng Việt chuẩn |
| Animation | **CSS keyframes + Radix Presence** (không cần Motion) | Radix đợi animation `*-out` chạy xong mới gỡ phần tử, nên mega menu, drawer, sheet, modal đều **có animation thoát**. Menu kênh liên hệ luôn nằm trong DOM, dùng transition + `inert`. Token nằm trong `globals.css` (`animate-*-in/out`). Chỉ thêm Motion khi có hiệu ứng CSS không làm được |
| Primitive UI | **Radix UI** (NavigationMenu, Dialog, Popover, Accordion) | Có sẵn a11y, focus trap, phím tắt; tự style hoàn toàn |
| Carousel | **Embla Carousel** | Nhẹ, snap tự nhiên trên mobile |
| Form | **react-hook-form + zod** | Dùng chung schema giữa client, Server Action và Payload |
| Đa ngôn ngữ | **next-intl**, `locales: ['vi']`, `localePrefix: 'as-needed'` | URL tiếng Việt không có tiền tố (`/tour/ha-giang`). Thêm `en` sau thì URL là `/en/tour/...`, không phải sửa route |
| Ảnh | `next/image` + Vercel Blob | Tự tạo nhiều kích thước, lazy-load |
| Test | **Vitest + Testing Library** · **Playwright** | |

**Cấu trúc thư mục đề xuất:**
```
src/
  app/
    [locale]/...            trang public
    (payload)/...           admin + api (Payload sinh)
  components/
    ui/        Button, Chip, Badge, Price, Container, SectionHeader, Carousel, Logo...
    layout/    Header, MegaMenu, StickyHeader, MobileDrawer, Footer, FloatingContact, LocaleSwitcher
    tour/      TourCard, TourGallery, Itinerary, DepartureTable, BookingRequestForm
    home/      HeroSlider, SearchBar, SearchSuggest, UspBar, DestinationMosaic...
  collections/ globals/     schema Payload
  i18n/        cấu hình next-intl, messages/vi.json
  lib/         data (hàm đọc Payload), validation (zod), format (giá, ngày)
  styles/      tokens.css
```

### 2.1 Hệ thống thiết kế: áp dụng DESIGN-zapier.md cho site du lịch

**Giữ nguyên từ DESIGN-zapier.md:**

| Token | Giá trị | Dùng cho |
|---|---|---|
| `primary` | `#FF4F00` | CTA chính (Đặt tour, Tìm tour, Gửi yêu cầu), **giá bán**, trạng thái active, logo |
| `on-primary` | `#FFFEFB` | Chữ trên nền cam / nền tối |
| `ink` | `#201515` | Heading, chữ chính, button phụ, **nền footer** |
| `ink-soft` / `ink-mid` | `#2F2A26` / `#36342E` | Chữ nhấn vừa |
| `body` | `#605D52` | Đoạn văn |
| `body-mid` | `#939084` | Meta: số ngày, điểm đi, ngày đăng, giá gốc gạch ngang |
| `mute` | `#C5C0B1` | Viền hairline, chữ phụ nhất |
| `canvas` | `#FFFEFB` | Nền trang (**không dùng trắng tinh**) |
| `canvas-soft` | `#F8F4F0` | Nền card, dải section xen kẽ, ô tìm kiếm |
| Bo góc | `sm 6` (input) · `md 12` (button, card, ảnh) · `pill` (badge, chip) | |
| Spacing | Bước 4px: 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 | Section `py-16` (64px), card `p-6` (24px) |
| Button | Cao ~48px, `px-6 py-3`, chữ 18px/600, bo 12px. Biến thể: primary (cam), secondary (ink), tertiary (viền ink), text | |
| Input | Nền canvas, viền 1px ink, bo 6px, chữ 18px | |

**Điều chỉnh cho du lịch** (DESIGN-zapier viết cho SaaS, ít ảnh):
1. **Ảnh là nhân vật chính:** ảnh tour/điểm đến luôn đặt trong khung bo 12px. Chữ trắng trên ảnh phải có gradient `ink` phủ đáy.
2. **Chỉ một màu nhấn:** không dùng xanh cho link như site tham khảo. Link là chữ `ink` + gạch chân. Giá bán dùng `primary`.
3. **Độ nổi theo DESIGN-zapier:** card dùng nền `canvas-soft` trên nền `canvas`, hoặc viền hairline, không dùng đổ bóng mờ. Riêng lớp phủ (mega menu, panel gợi ý, modal, drawer) được phép có bóng để tách lớp.
4. **Button bo 12px, không bo tròn pill.** Pill chỉ dùng cho chip lọc, badge ("HOT", "Còn 5 chỗ").
5. **Màu trạng thái** (DESIGN-zapier không có): chỉ dùng trong form và thông báo. `success #1F7A4D`, `error #B42318`, `warning #B54708`.
6. **Hiệu ứng giữ từ nghiên cứu PYS:** thẻ tour nhấc 8px, gạch chân menu chạy từ giữa ra (màu `primary`), ảnh điểm đến zoom chậm 1s, dot slider dạng pill. Tất cả tôn trọng `prefers-reduced-motion`.

**Thang chữ** (map từ DESIGN-zapier, display đổi sang Be Vietnam Pro):

| Token | Desktop | Mobile | Dùng cho |
|---|---|---|---|
| `display-xl` | 56/56 · 600 | 36/40 | Tiêu đề hero |
| `display-lg` | 48/48 · 600 | 32/36 | Tiêu đề trang |
| `display-md` | 32/36 · 600 | 24/30 | Tiêu đề section |
| `display-sub-sm` | 24/30 · 600 (Inter) | 20/26 | Tiêu đề card lớn |
| `display-xs` | 20/25 · 700 (Inter) | 18/24 | Tiêu đề thẻ tour |
| `body-lg` / `body-md` / `body-sm` | 20/30 · 18/27 · 16/24 | 18 · 16 · 15 | Nội dung |
| `caption` | 14/21 | 13 | Meta |
| `eyebrow` | 14 · 500 · UPPERCASE · tracking 1px | | Nhãn trên tiêu đề section |

### 2.2 Logo

File trong [`docs/brand/`](brand/). Chuyển vào `public/brand/` ở giai đoạn 0.

| File | Dùng cho |
|---|---|
| `rosa-mark.svg` | Favicon, app icon, avatar mạng xã hội, OG image |
| `rosa-logo.svg` | Header, nền sáng |
| `rosa-logo-dark.svg` | Footer (nền `ink`) |

- **Ý tưởng:** ghim bản đồ (du lịch) cam `primary`, lòng ghim là bông **hồng dại 5 cánh** màu `canvas` với nhụy cam ("Rosa"). Hình khối đơn giản (5 cánh tròn) nên vẫn đọc rõ ở favicon 16px. Đã thử và loại hai phương án: hoa xoắn (nhìn giống hồng tâm) và nụ hoa (nhìn giống cái bát).
- **Vùng an toàn:** chừa trống quanh logo tối thiểu bằng ½ chiều rộng ghim. Cỡ nhỏ nhất: mark 16px, logo đầy đủ cao 24px.
- **Không được:** đổi màu ghim ngoài `primary`, `ink` hoặc `canvas`; kéo méo tỷ lệ; thêm bóng hay viền.
- **Wordmark:** "Rosa" 700 màu `ink` + "Travel" 500 màu `body`, font Be Vietnam Pro.
- Trên site, logo nên là component `Logo` = SVG mark + chữ HTML dùng `next/font`, để chữ luôn đúng font. File `.svg` có thẻ `<text>` chỉ dùng xem trước. Khi cần in ấn hoặc đăng lên nền tảng ngoài, phải convert chữ sang path (outline).

---

## 3. Backend (Payload CMS 3)

### 3.1 Đa ngôn ngữ nội dung (làm ngay từ đầu)
- Payload `localization: { locales: [{ code: 'vi', label: 'Tiếng Việt' }], defaultLocale: 'vi', fallback: true }`.
- Mọi field nội dung khách đọc (tiêu đề, slug, mô tả, lịch trình, SEO…) đặt `localized: true` **ngay từ đầu**. Field kỹ thuật (giá, số ngày, ảnh, quan hệ) không localized.
- Khi thêm tiếng Anh: thêm locale `en` trong Payload + next-intl + file `messages/en.json`, nhân viên dịch trong admin. **Không cần migrate dữ liệu.**
- `LocaleSwitcher` ẩn khi chỉ có một ngôn ngữ, tự hiện khi có từ hai.

### 3.2 Collections

| Collection | Trường chính | Dùng ở |
|---|---|---|
| `tours` | tiêu đề, slug, ảnh bìa + gallery, số ngày/đêm, điểm khởi hành, điểm đến (rel), danh mục (rel), giá gốc/giá bán, điểm nổi bật, lịch trình (mảng ngày), bao gồm/không bao gồm, chính sách, SEO, cờ HOT/xu hướng | Thẻ tour, trang chi tiết, carousel |
| `departures` | tour (rel), ngày khởi hành, giá theo ngày, số chỗ còn, trạng thái | Bảng lịch khởi hành, "còn chỗ" |
| `destinations` | tên, slug, vùng, ảnh, mô tả | Lưới điểm đến, mega menu, landing điểm đến |
| `tour-categories` | tên, slug, loại (mùa/chùm tour/đoàn riêng), ảnh, thứ tự | Menu, danh mục xu hướng, trang danh mục |
| `reviews` | khách, avatar, địa chỉ, tour (rel), số sao, trích dẫn, duyệt | Carousel đánh giá |
| `posts` | tiêu đề, slug, ảnh, chuyên mục (cẩm nang/tin/khuyến mãi/báo chí), nội dung Lexical, SEO | Blog, tin tức |
| `banners` | ảnh desktop/mobile, link, vị trí, hiệu lực từ–đến | Hero slider, hàng khuyến mãi |
| `clients` | logo, tên, link | Logo doanh nghiệp |
| `booking-requests` | loại (đặt tour / tư vấn / nhận ưu đãi), họ tên, SĐT, email, tour + ngày khởi hành, số người lớn/trẻ em, ghi chú, ngôn ngữ, nguồn (UTM, trang gửi), **trạng thái** (mới → đã liên hệ → đã chốt / hủy), người phụ trách, ghi chú nội bộ | Quản lý yêu cầu đặt tour |
| `media` | ảnh (Vercel Blob), alt bắt buộc (localized) | Mọi nơi |
| `users` | role: `admin` / `editor` / `sales` | Phân quyền admin |

### 3.3 Globals
- `site-settings`: tên, hotline, email, địa chỉ, giấy phép; **kênh liên hệ**: `zalo`, `facebook`, `messenger`, `instagram`, `threads` (URL, bật/tắt, thứ tự).
- `header`: cấu hình mega menu.
- `footer`.
- `home`: chọn tour cho từng carousel, thứ tự section.

### 3.4 Luồng nghiệp vụ phía server
- **Đọc dữ liệu:** Payload Local API trong `lib/data/*` (truyền `locale`), chỉ lấy field cần. Cache theo tag.
- **Làm mới nội dung:** hook `afterChange`/`afterDelete` gọi `revalidateTag`.
- **Tìm kiếm:** `GET /api/search?q=&locale=` trả gợi ý tour + điểm đến, Mongo text index bỏ dấu.
- **Yêu cầu đặt tour** (không thanh toán):
  1. Server Action validate zod.
  2. Chống spam: honeypot + Cloudflare Turnstile + rate limit theo IP.
  3. Lưu `booking-requests` trạng thái `mới`.
  4. Email cho sales (Resend).
  5. Email xác nhận cho khách nếu có email.
  6. Trang cảm ơn, có nút nhắn Zalo/Messenger để trao đổi nhanh.
- **Phân quyền:** `sales` xem/sửa `booking-requests`; `editor` quản lý nội dung; `admin` toàn quyền.

### 3.5 Lưu ý kỹ thuật
- `@vercel/blob`, `undici` phải nằm trong `serverExternalPackages` của `next.config`.
- Chỉ chạy **một** tiến trình Next tại một thời điểm (`next dev` và `next start` tranh `.next`).
- Thêm tên db vào `MONGODB_URI` (vd. `.../rosatravel?retryWrites=...`). Tài khoản `Vercel-Admin-rosatravel` không có quyền `dropDatabase`.
- Vercel Blob còn 168 file (~26 MB) của bản cũ, chưa xóa.
- Cần cấp lại `RESEND_API_KEY` trước giai đoạn 4.

---

## 4. Trang cần có

| Route (vi, không tiền tố) | Nội dung | Render |
|---|---|---|
| `/` | Trang chủ theo các section trong docs nghiên cứu | ISR |
| `/tour/[slug]` | Gallery, tóm tắt, lịch trình, lịch khởi hành + giá, bao gồm/không bao gồm, **form yêu cầu đặt tour** dính bên phải (mobile: nút cố định đáy mở bottom sheet), tour liên quan, đánh giá | ISR |
| `/danh-muc/[slug]` | Danh sách tour + bộ lọc (điểm đi, số ngày, khoảng giá, tháng) + sắp xếp | ISR + searchParams |
| `/diem-den/[slug]` | Giới thiệu điểm đến + tour | ISR |
| `/tim-kiem` | Kết quả tìm kiếm | Dynamic |
| `/cam-nang`, `/cam-nang/[slug]` | Blog | ISR |
| `/lien-he` | Form tư vấn, các kênh liên hệ, bản đồ | Static + Server Action |
| `/dat-tour/thanh-cong` | Cảm ơn + nút Zalo/Messenger | Static |
| `/gioi-thieu`, trang chính sách | Nội dung tĩnh | ISR |
| `sitemap.xml`, `robots.txt` | Sinh từ dữ liệu, có `hreflang` khi thêm ngôn ngữ | |

### 4.1 FloatingContact (5 kênh)
- **Desktop:** nút tròn `primary` góc phải dưới. Bấm vào thì bung dọc 5 nút kênh (Zalo, Messenger, Facebook, Instagram, Threads), mỗi nút có tooltip tên kênh. Bung có stagger, **thu lại cũng có animation thoát**. Đóng bằng Esc hoặc bấm ra ngoài.
- **Desktop header:** hotline (icon + số) luôn hiện bên phải menu.
- **Mobile:** thanh đáy cố định gồm `Gọi` · `Zalo` · **`Đặt tour`** (nút cam, giữa) · `Thêm` (mở bottom sheet chứa Messenger, Facebook, Instagram, Threads). Kênh nào trống thì bị ẩn khỏi sheet; nếu cả 4 đều trống thì ẩn luôn nút `Thêm`.
- **Hành vi link:**

  | Kênh | Link | Mở |
  |---|---|---|
  | Zalo | `zalo.me/<OA hoặc SĐT>` | App nếu có |
  | Messenger | `m.me/<page>` | Chat trực tiếp |
  | Facebook | `facebook.com/<page>` | Tab mới |
  | Instagram | `instagram.com/<user>` | Tab mới |
  | Threads | `threads.net/@<user>` | Tab mới |

- URL lấy từ global `site-settings`. Kênh nào để trống thì tự ẩn.
- Gắn sự kiện analytics `contact_click` kèm tên kênh.

---

## 5. Lộ trình theo giai đoạn

Mỗi giai đoạn kết thúc bằng một bản deploy preview chạy được.

### Giai đoạn 0 · Nền móng
- [x] `.gitignore` (có `.env*`) **trước commit đầu tiên**
- [x] Init Next 16.3 + Payload 3.89 (template `blank`), TypeScript, ESLint (flat config của `eslint-config-next`), Prettier
- [x] Kết nối MongoDB (db `rosatravel`) + plugin Vercel Blob cho `media`; admin giao diện tiếng Việt
- [ ] Tạo tài khoản admin đầu tiên (chủ dự án tự đặt mật khẩu tại `/admin`)
- [ ] Thử upload một ảnh trong admin để xác nhận ảnh lên Vercel Blob
- [x] next-intl (`vi`, `as-needed`, `src/proxy.ts`) + Payload localization (`vi`)
- [x] Tailwind v4, token theo mục 2.1 trong `src/styles/globals.css`; Be Vietnam Pro + Inter
- [x] Logo trong `public/brand/`, component `Logo`, favicon
- [ ] apple-touch-icon (PNG) + ảnh OG mặc định
- [x] Vitest chạy được (`pnpm test:int`)
- [ ] Playwright chạy được (lưu ý: test admin tạo rồi xóa một user thử trong DB thật)
- [ ] Commit đầu tiên + deploy preview lên Vercel (khai env trên Vercel)

**Xong khi:** trang trắng có logo, font, token; `/admin` đăng nhập được trên preview.

### Giai đoạn 1 · Design system & component lõi
- [x] `Logo`, `Container`, `SectionHeader` (eyebrow + tiêu đề + link), `Button` (4 biến thể), `Chip`, `Badge`, `Price`, `Rating`, `Input`, `BrandIcon`
- [ ] `Select`: để sang giai đoạn 3, làm cùng bộ lọc danh mục tour
- [x] `TourCard` (cả thẻ chỉ một link) + `TourMiniCard` + `Carousel` (Embla; desktop có mũi tên, mobile vuốt)
- [x] `Header` sticky (đổ bóng khi cuộn) + mega menu Radix có animation vào/ra + `LocaleSwitcher` (ẩn khi 1 ngôn ngữ)
- [x] `MobileNav` (drawer, mục con xổ xuống có chuyển động) + `FloatingContact` (desktop bung kênh / mobile thanh đáy Gọi · Zalo · Đặt tour · Thêm + sheet)
- [x] `Footer` nền `ink`
- [x] Trang `/ui-kit` nội bộ (tự 404 trên production). Không đặt `/_ui` vì Next bỏ qua thư mục bắt đầu bằng `_`
- [x] Test: 21 test cho tiện ích (giá, link liên hệ), `TourCard`, `FloatingContact`, `LocaleSwitcher`

**Xong khi:** mọi component có test render + trạng thái, dùng được bằng bàn phím, tôn trọng `prefers-reduced-motion`.

### Giai đoạn 2 · Schema CMS & dữ liệu mẫu
- [x] Collections: `tours`, `destinations`, `tour-categories`, `booking-requests`, `posts`, `pages`, `banners`, `reviews`, `clients`, `media`, `users`. Globals: `home`, `header`, `footer`, `site-settings`. Field nội dung đều `localized`
- [x] **Blocks** kéo thả được: 10 khối trang tour (`src/blocks/content.ts`), 11 section trang chủ và 7 khối trang tĩnh (`src/blocks/home.ts`)
- [x] **Versions + drafts + autosave (2 giây)** cho `tours`, `destinations`, `posts`, `pages`, global `home`
- [x] **Live Preview**: đã cấu hình URL + khung Điện thoại/Máy tính bảng/Máy tính, route `/next/preview` (chỉ người đã đăng nhập admin) và component `LivePreviewListener`. Chỉ xem được thật khi các trang có ở giai đoạn 3
- [x] Banner tự hiện/ẩn theo "Hiện từ ngày" / "Ẩn sau ngày". **Không** dùng `schedulePublish` của Payload vì cần hàng đợi jobs chạy theo lịch trên Vercel
- [x] Phân quyền: `admin` toàn quyền · `editor` sửa nội dung · `sales` chỉ xử lý `booking-requests`. Người dùng đầu tiên tự thành `admin`. API công khai không tạo được `booking-requests`
- [x] Nhãn, mô tả, thông báo lỗi trong admin bằng tiếng Việt; slug tự sinh và bỏ dấu tiếng Việt
- [x] Script seed `pnpm payload run src/scripts/seed.ts`: điền thông tin liên hệ mục 6 khi "Cài đặt chung" còn trống. Không tạo tour mẫu trong DB thật
- [x] Hook làm mới cache theo tag khi xuất bản / gỡ xuất bản / xóa (bỏ qua tự lưu nháp), `revalidateTag(tag, 'max')` theo Next 16
- [ ] Hàm đọc dữ liệu Payload → props component (`src/lib/data`): làm ở giai đoạn 3 cùng các trang

**Thay đổi so với plan ban đầu:** lịch khởi hành là bảng nằm trong trang sửa tour thay vì collection `departures` riêng, để nhân viên sửa ngày, giá, số chỗ cùng một chỗ và lịch khởi hành được lưu phiên bản cùng tour.

**Xong khi:** một nhân viên **không cần dev hỗ trợ** mà vẫn tự làm được: tạo tour đầy đủ (ảnh, lịch trình, giá, ngày khởi hành), xem trước, xuất bản rồi thấy lên site, đổi thứ tự khối trên trang tour, sửa hotline và 5 kênh liên hệ.

### Giai đoạn 3 · Các trang
- [x] Lớp đọc dữ liệu `src/lib/data` (cache theo tag, bỏ qua cache khi xem nháp) + hàm chuyển dữ liệu Payload → props component
- [x] Khung chung: Header, Footer, nút liên hệ lấy từ admin; thanh "đang xem bản nháp"; link bỏ qua tới nội dung; trang 404
- [x] Trang chủ: hiển thị các section nhân viên chọn trong admin (chưa cấu hình thì hiện "sắp ra mắt")
- [x] Chi tiết tour `/tour/[slug]`: bộ ảnh, thông tin, khung đặt tour dính bên phải, lịch khởi hành (tự ẩn ngày đã qua), 10 loại khối, tour liên quan
- [x] Danh mục `/danh-muc/[slug]` + bộ lọc (điểm đi, số ngày, giá, tháng khởi hành, sắp xếp) + phân trang; form GET chạy cả khi không có JavaScript
- [x] Điểm đến `/diem-den/[slug]`, cẩm nang `/cam-nang` (lọc chuyên mục) + bài viết `/cam-nang/[slug]`, trang tĩnh `/[slug]`, liên hệ `/lien-he` (nội dung sửa ở Trang tĩnh slug `lien-he`, hiện tour đang quan tâm khi có `?tour=`)
- [ ] `/tim-kiem`, `/dat-tour/thanh-cong`, form đăng ký nhận ưu đãi, ô tìm kiếm trên banner, form yêu cầu đặt tour: làm ở giai đoạn 4
- [ ] Soát giao diện điện thoại bằng ảnh chụp từng trang: làm cùng Lighthouse/Playwright ở giai đoạn 5 (component mobile đã kiểm tra ở giai đoạn 1)

**Ghi chú kỹ thuật:**
- **Cache:** không bật Cache Components của Next 16 vì nó đổi cách render toàn app, kể cả admin Payload. Dùng `unstable_cache` + tag, là mô hình cache trước đây mà Next 16 vẫn hỗ trợ. Tour, banner cache thêm theo thời gian (1 giờ / 10 phút) để ngày khởi hành đã qua và banner hết hạn tự ẩn.
- **Lọc tháng khởi hành:** tour có trường ẩn `departureMonths`, tự tính khi lưu. Không lọc thẳng trên mảng lịch khởi hành, vì hai điều kiện rời có thể khớp hai ngày khác nhau.
- **Xem giao diện với dữ liệu mẫu:** dùng database riêng `rosatravel_qa` + `pnpm payload run src/scripts/seed-qa.ts`, luôn đặt `DISABLE_BLOB_STORAGE=true`. Script từ chối chạy với DB thật hoặc khi Blob còn bật. Không đưa dữ liệu mẫu vào DB thật.

**Xong khi:** mọi route ở mục 4 hiển thị từ dữ liệu CMS, responsive 390 → 1536.

### Giai đoạn 4 · Tìm kiếm & yêu cầu đặt tour
- [ ] `/api/search` + `SearchSuggest` (debounce, bàn phím, đóng có animation)
- [ ] `BookingRequestForm` (chi tiết tour) + form tư vấn + nhận ưu đãi → `booking-requests` → email sales + email xác nhận khách
- [ ] Chống spam; trang cảm ơn

**Xong khi:** gửi form trên preview → có bản ghi trạng thái "mới" trong admin + email về hộp thư sales.

### Giai đoạn 5 · SEO, hiệu năng, đo lường
- [ ] Metadata, Open Graph, canonical
- [ ] JSON-LD: `TravelAgency`, `TouristTrip` cho tour, `BreadcrumbList`, `Article`
- [ ] Lighthouse mobile ≥ 90 (Performance, SEO, A11y)
- [ ] GA4/GTM: `booking_request_submit`, `contact_click` (theo kênh), `search`
- [ ] Playwright smoke: trang chủ → tìm kiếm → chi tiết → gửi yêu cầu

### Giai đoạn 6 · Go-live
- [ ] Domain, Search Console, sitemap
- [ ] Backup MongoDB, giám sát lỗi
- [ ] Hướng dẫn nhân viên nhập liệu và xử lý yêu cầu đặt tour

### Sau launch
- Thêm tiếng Anh (và các ngôn ngữ khác): chỉ cần thêm locale + dịch nội dung
- Thanh toán online / đặt cọc → lúc này cân nhắc tách service booking
- Tài khoản khách hàng
- Đồng bộ CRM, Zalo OA API tự gửi tin khi có yêu cầu mới

---

## 6. Thông tin liên hệ & cấu hình ban đầu

Chốt ngày 14/09/2026. **Mọi giá trị dưới đây đều có thể đổi về sau**, nên chỉ dùng làm dữ liệu seed cho global `site-settings`, **không hard-code trong code**.

| Mục | Giá trị ban đầu | Ghi chú |
|---|---|---|
| Logo | Đã duyệt, `docs/brand/` | |
| Hotline (gọi) | `0973122807` → `tel:+84973122807` | Hiện trên header, thanh đáy mobile, trang liên hệ |
| Zalo | Số điện thoại `0973122807` → `https://zalo.me/0973122807` | Chưa có OA |
| Facebook | *(chưa có)* | Để trống thì tự ẩn |
| Messenger | *(chưa có)* | Để trống thì tự ẩn |
| Instagram | *(chưa có)* | Để trống thì tự ẩn |
| Threads | *(chưa có)* | Để trống thì tự ẩn |
| Email nhận yêu cầu đặt tour | `lecuongg242@gmail.com` | Người nhận email thông báo khi có yêu cầu mới |
| Tên miền | `https://rosatravel.vercel.app` | Dùng cho `NEXT_PUBLIC_SITE_URL` production, canonical, sitemap, OG. Ở local vẫn là `http://localhost:3000` |

**Còn thiếu (không chặn tiến độ):**
- Link Facebook, Messenger, Instagram, Threads: nhập trong admin khi có.
- `RESEND_API_KEY` + tên miền gửi email đã xác minh: cần trước giai đoạn 4. Chưa có tên miền riêng thì Resend chỉ gửi được bằng địa chỉ thử nghiệm của họ.
