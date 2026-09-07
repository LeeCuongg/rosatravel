# RosaTravel

Landing page bán tour du lịch, tập trung vào trải nghiệm cuộn dạng *cinematic scroll-telling*.

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Motion · GSAP ScrollTrigger · Lenis · next-intl

## Chạy dự án

```bash
pnpm install
pnpm placeholders   # BẮT BUỘC ở lần đầu — xem mục Ảnh bên dưới
pnpm dev            # http://localhost:3000/vi
```

`/` tự chuyển hướng sang `/vi`.

## Ảnh — đọc trước khi build

`public/media/` và `assets-src/` nằm trong `.gitignore`, nên **một bản clone mới không có ảnh nào**. Trang sẽ build được nhưng mọi ảnh đều 404 cho tới khi bạn sinh chúng.

```bash
pnpm placeholders   # sinh ảnh giữ chỗ để dự án chạy được
pnpm media          # xử lý ảnh thật đặt trong assets-src/
pnpm video          # encode video trong assets-src/video/ (cần ffmpeg)
```

**Quy trình đưa ảnh thật vào:**

1. Đặt ảnh gốc vào `assets-src/` (đặt theo thư mục tour cho dễ quản lý)
2. Chạy `pnpm media` — sinh AVIF/WebP ở 4 bề rộng 640/1024/1600/2400, kèm blur placeholder
3. Script ghi metadata ra `content/media-manifest.json`; copy khối cần dùng sang `content/tours/*.json` và **điền `alt` tiếng Việt** (script để `TODO` vì nó không biết ảnh chụp gì)

Ảnh gốc nên rộng ít nhất 2400px. Script sẽ cảnh báo nếu nhỏ hơn — ảnh vẫn hiển thị nhưng sẽ mờ trên màn hình lớn.

**Khi deploy:** vì `public/media` bị gitignore, chọn một trong hai cách và giữ nhất quán — hoặc chạy `pnpm media && pnpm video` trong build command của Vercel (phải commit `assets-src/`, repo nặng), hoặc bỏ `public/media` khỏi `.gitignore` và commit ảnh đã tối ưu (khuyến nghị: AVIF đã nén nhỏ hơn ảnh gốc nhiều lần).

## Nội dung

Nội dung nằm trong `content/`, được validate bằng zod lúc đọc:

```
content/home.json              nội dung trang chủ
content/tours/<slug>.json      mỗi tour một file
```

Component **chỉ** đọc nội dung qua `src/lib/content/index.ts`. Không component nào biết dữ liệu nằm ở đâu hay lưu dạng gì — đó là điều kiện để sau này thay bằng CMS mà không đụng giao diện.

Mọi trường văn bản hướng người đọc bọc theo ngôn ngữ: `{ "vi": "..." }`. Thêm tiếng Anh sau này là thêm khoá `en`, không phải sửa schema.

> **Chưa thay:** `content/home.json` đang để số điện thoại `0900000000` và email `lienhe@example.com` làm giá trị mẫu.

## Biến môi trường

Copy `.env.example` thành `.env.local`:

| Biến | Dùng để |
|---|---|
| `RESEND_API_KEY` | Gửi email từ form liên hệ. Thiếu → form trả lỗi 500 có kiểm soát |
| `CONTACT_EMAIL_TO` | Địa chỉ nhận yêu cầu đặt tour |
| `CONTACT_EMAIL_FROM` | Địa chỉ gửi (phải thuộc domain đã xác thực ở Resend) |

## Deploy

**Bắt buộc:** đặt `NEXT_PUBLIC_SITE_URL` (URL gốc thật, ví dụ `https://rosatravel.vn`) trong Vercel Project Settings → Environment Variables **trước lần deploy đầu tiên**. `pnpm build` ở môi trường production sẽ cố ý báo lỗi và dừng nếu biến này chưa được đặt (xem `src/lib/site.ts`) — vì thiếu nó thì sitemap và mọi thẻ `og:` sẽ âm thầm trỏ về `localhost`, Search Console từ chối sitemap và mọi lần share Zalo/Facebook đều hỏng ảnh.

Pipeline video (`pnpm video`) chưa được cài đặt — xem mục Lệnh bên dưới.

## Hệ animation

Ba tầng, quyết định tại runtime từ `prefers-reduced-motion`, loại con trỏ, RAM và số nhân CPU:

| Tầng | Khi nào | Hành vi |
|---|---|---|
| `reduced` | Người dùng bật giảm chuyển động | Chỉ fade. Không pin, không scrub, tắt smooth scroll |
| `lite` | Cảm ứng, RAM ≤ 4GB, hoặc CPU ≤ 4 nhân | Bố cục thay thế hoàn chỉnh — không pin, không scrub |
| `full` | Còn lại | Đầy đủ |

Tầng `lite` **không phải bản bị cắt xén**: các section cinematic có bố cục riêng được thiết kế cho màn hình nhỏ.

Quy ước bắt buộc khi sửa code animation:

- Chỉ animate `transform` và `opacity`
- Timing JS lấy từ `src/lib/motion/tokens.ts`; timing CSS lấy từ biến `--duration-*` / `--ease-*` trong `globals.css`. Hai bản phải khớp nhau
- `transition-*` đứng một mình cũng không được — nó lấy easing mặc định của Tailwind, không khớp token
- Component nào tạo ScrollTrigger thì tự kill trong cleanup của mình
- Mọi `import()` GSAP/Lenis phải có `.catch`

## Lệnh

```bash
pnpm dev            # server phát triển
pnpm build          # build production
pnpm start          # chạy bản build
pnpm test           # Vitest
pnpm lint           # ESLint
pnpm placeholders   # sinh ảnh giữ chỗ
pnpm media          # xử lý ảnh trong assets-src/
pnpm video          # encode video (cần ffmpeg)
```

## Tài liệu thiết kế

- [Spec giai đoạn 1](docs/superpowers/specs/2026-09-06-travel-landing-page-design.md) — phạm vi, kiến trúc, tiêu chí nghiệm thu
- [Implementation plan](docs/superpowers/plans/2026-09-06-travel-landing-page-phase1.md) — 15 task, từng bước một
