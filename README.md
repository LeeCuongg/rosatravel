# RosaTravel

Landing page bán tour du lịch, tập trung vào trải nghiệm cuộn dạng *cinematic scroll-telling*.

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Motion · GSAP ScrollTrigger · Lenis · next-intl

## Chạy dự án

```bash
pnpm install
cp .env.example .env.local   # điền các biến — xem mục Biến môi trường bên dưới
pnpm dev                     # http://localhost:3000/vi
```

`/` tự chuyển hướng sang `/vi`. Trang quản trị nội dung ở `/admin` (lần đầu vào sẽ được yêu cầu tạo tài khoản quản trị).

## Ảnh

Không còn quy trình chạy tay nào — ảnh vào site hoàn toàn qua `/admin`:

1. Vào `/admin` → **Thư viện ảnh** → tải ảnh lên
2. Điền **mô tả (alt) tiếng Việt** — gõ một lần duy nhất trên bản ghi ảnh, mọi nơi dùng lại ảnh đó (trang chủ, tour, gallery...) đều tự dùng chung mô tả này
3. Xong — Payload tự sinh mọi biến thể ngay lúc lưu, không có bước nào khác

Mỗi ảnh tải lên sinh ra: bốn biến thể AVIF ở bề rộng 640/1024/1600/2400px (dùng cho `srcset` trên site), một biến thể JPEG 1200×630 cho thẻ chia sẻ Zalo/Facebook (Zalo và Facebook không đọc được AVIF), và một ảnh mờ giữ chỗ nhúng thẳng vào bản ghi. Tất cả lưu trên Vercel Blob — repo không chứa file ảnh nào.

**Ảnh gốc nên rộng tối thiểu 2400px.** Nhỏ hơn vẫn tải lên được, nhưng admin sẽ hiện cảnh báo ngay trên bản ghi ảnh đó, và ảnh sẽ mờ trên màn hình lớn.

> **`pnpm video` chưa được cài đặt.** Lệnh này hiện chỉ in cảnh báo và thoát khác 0 — pipeline ffmpeg bị hoãn có chủ đích (xem Task 12 trong `docs/superpowers/plans/`).

## Nội dung

Toàn bộ nội dung — trang chủ, danh sách tour, ảnh — nhập và sửa qua `/admin`, lưu trong MongoDB Atlas. Lưu xong là lên site sau vài giây (revalidate tự động, xem `src/lib/revalidate.ts`), không cần build hay deploy lại.

Component **chỉ** đọc nội dung qua `src/lib/content/index.ts`. Không component nào biết dữ liệu nằm ở CMS hay lưu dạng gì — đó là điều kiện đã cho phép thay toàn bộ nguồn dữ liệu từ file JSON tĩnh sang Payload (GĐ2) mà không sửa một component nào.

Hình dạng dữ liệu được giữ khớp nhau ở hai nơi: `src/lib/content/schema.ts` (zod, phía đọc) và các collection/global Payload — `src/collections/Tours.ts`, `src/globals/Home.ts` (phía nhập liệu). Không có gì tự động giữ hai bên này đồng bộ.

Mọi trường văn bản hướng người đọc bọc theo ngôn ngữ: `{ "vi": "..." }`. Tiếng Anh để dành cho giai đoạn sau — trường `alt` của ảnh đã có sẵn ô tiếng Anh trong admin, các trường khác cần thêm field `en` vào Payload khi tới lúc.

## Biến môi trường

Copy `.env.example` thành `.env.local`:

| Biến | Dùng để |
|---|---|
| `RESEND_API_KEY` | Gửi email từ form liên hệ. Thiếu → form trả lỗi 500 có kiểm soát |
| `CONTACT_EMAIL_TO` | Địa chỉ nhận yêu cầu đặt tour |
| `CONTACT_EMAIL_FROM` | Địa chỉ gửi (phải thuộc domain đã xác thực ở Resend) |
| `MONGODB_URI` | Chuỗi kết nối MongoDB Atlas (Atlas → Connect → Drivers) — nơi lưu toàn bộ nội dung |
| `PAYLOAD_SECRET` | Chuỗi ngẫu nhiên dài, ký phiên đăng nhập `/admin`. Sinh bằng `openssl rand -base64 32` |
| `BLOB_READ_WRITE_TOKEN` | Token đọc/ghi Vercel Blob (Vercel → Storage → Blob) — nơi lưu toàn bộ ảnh |

Thiếu bất kỳ biến nào trong ba biến CMS ở trên, `pnpm build`/`pnpm dev` cố ý báo lỗi và dừng ngay (xem `src/payload.config.ts`, hàm `required()`) thay vì để lỗi driver Mongo mù mờ hiện ra sau.

## Deploy

**Bắt buộc trước lần deploy đầu tiên** — đặt trong Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_SITE_URL` (URL gốc thật, ví dụ `https://rosatravel.vn`). `pnpm build` ở môi trường production cố ý báo lỗi và dừng nếu thiếu (xem `src/lib/site.ts`) — vì thiếu nó thì sitemap và mọi thẻ `og:` sẽ âm thầm trỏ về `localhost`, Search Console từ chối sitemap và mọi lần share Zalo/Facebook đều hỏng ảnh.
- `MONGODB_URI`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN` — xem mục Biến môi trường ở trên. Thiếu một trong ba, build cũng cố ý vỡ ngay tại `required()` thay vì để lại lỗi mù mờ ở tầng driver.

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
pnpm video          # CHƯA CÀI ĐẶT — in cảnh báo rồi thoát khác 0
```

## Tài liệu thiết kế

- [Spec giai đoạn 1](docs/superpowers/specs/2026-09-06-travel-landing-page-design.md) — phạm vi, kiến trúc, tiêu chí nghiệm thu
- [Implementation plan](docs/superpowers/plans/2026-09-06-travel-landing-page-phase1.md) — 15 task, từng bước một
