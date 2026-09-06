# Thiết kế: Landing page bán tour du lịch — Giai đoạn 1

- **Ngày:** 2026-09-06
- **Trạng thái:** Đã duyệt, sẵn sàng lập implementation plan
- **Thư mục dự án:** `d:\Rosa`

## 1. Bối cảnh và mục tiêu

Xây dựng website bán tour du lịch, tập trung mạnh vào chất lượng frontend và trải nghiệm chuyển động dạng *cinematic scroll-telling*. Mục tiêu kinh doanh là thuyết phục khách hàng bằng hình ảnh và video thực tế của tour, dẫn tới hành động liên hệ đặt tour.

Chủ dự án có sẵn ảnh chụp và video ngắn (flycam/hiện trường) cho các tour.

## 2. Phân rã giai đoạn

Yêu cầu ban đầu (site đầy đủ + CMS + đặt tour) là ba hệ thống độc lập. Gộp vào một lần triển khai sẽ cho kết quả nửa vời ở cả ba. Lộ trình:

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| GĐ 1 | Frontend marketing + content layer + hệ animation | Spec này |
| GĐ 2 | Thay nguồn dữ liệu bằng CMS thật | Chưa chọn nền tảng |
| GĐ 3 | Luồng đặt tour (form, lưu đơn, thông báo) | Chưa bắt đầu |

Thứ tự này cố ý đặt CMS sau frontend: GĐ 1 tạo ra trang bán hàng xem được ngay, và nếu data layer được tách đúng thì GĐ 2 chỉ là thay implementation, không đụng giao diện.

### Phạm vi GĐ 1

**Có:** trang chủ, trang chi tiết tour, nội dung tiếng Việt đọc từ file có schema, hệ animation cinematic hoàn chỉnh, pipeline xử lý ảnh/video, form liên hệ đơn giản gửi email, deploy Vercel.

**Không có:** admin panel, database, tài khoản người dùng, thanh toán, giỏ hàng, lịch khởi hành động, tiếng Anh.

## 3. Stack

- **Next.js 15 (App Router) + TypeScript + Tailwind v4**
- **next-intl** cho i18n
- **Motion** (framer-motion) cho reveal / hover / page transition
- **GSAP + ScrollTrigger** cho các section cinematic
- **Lenis** cho smooth scroll
- **zod** cho schema nội dung
- **sharp** cho pipeline ảnh (script build-time, không chạy runtime)
- **Vitest** cho test
- **Vercel** cho hosting

Lý do chọn hybrid Motion + GSAP: phần *nhiều nhất* của dự án là reveal khi vào viewport, hover và page transition — Motion viết ngắn gọn và hợp React. Phần *khó nhất* là pin section và scrub video theo scroll — GSAP ScrollTrigger làm tốt hơn hẳn. Dùng một thư viện cho cả hai đều phải bẻ cong nó ở một đầu.

GSAP chỉ được import động trong các component cinematic, để trang chi tiết tour và các trang nhẹ không phải trả giá bundle.

## 4. Kiến trúc content layer

Đây là quyết định kiến trúc quan trọng nhất của GĐ 1, vì nó quyết định GĐ 2 tốn một ngày hay tốn một tuần.

```
content/tours/<slug>.json     nội dung tour (dữ liệu thật, do chủ dự án cung cấp)
src/lib/content/schema.ts     zod schema — nguồn chân lý duy nhất về hình dạng dữ liệu
src/lib/content/index.ts      interface công khai: getTours(), getTour(slug), getHomeContent()
src/lib/content/fs.ts         implementation đọc file + validate bằng schema
```

**Ràng buộc bắt buộc:** mọi component chỉ được import từ `src/lib/content/index.ts`. Không component nào được đọc file, biết đường dẫn, hay biết định dạng lưu trữ. GĐ 2 sẽ thêm `src/lib/content/cms.ts` và đổi một dòng trong `index.ts`.

`index.ts` trả về type suy ra từ zod schema, nên đổi schema sẽ tạo compile error ở mọi nơi dùng sai — đây là cơ chế bảo vệ chính thay cho test tích hợp.

### Hình dạng dữ liệu tour (phác thảo)

Mỗi tour gồm: `slug`, `title`, `tagline`, `summary`, `durationDays`, `priceFrom` + `currency`, `destinations[]`, `heroMedia` (ảnh hoặc video), `gallery[]`, `itinerary[]` (mỗi ngày: `title`, `description`, `media?`), `inclusions[]`, `exclusions[]`, `notes?`, `seo` (`title`, `description`, `ogImage`).

Mọi trường văn bản hướng người đọc được bọc theo locale: `{ vi: string }`, mở rộng thành `{ vi: string; en: string }` khi bật tiếng Anh. Bọc ngay từ đầu để việc thêm ngôn ngữ là thêm dữ liệu, không phải migration.

## 5. i18n

Routing `/[locale]/...` với `next-intl`, `locales = ['vi']` và `defaultLocale = 'vi'` trong GĐ 1. Middleware và cấu trúc thư mục dựng sẵn cho nhiều locale; UI chuyển ngôn ngữ chỉ hiển thị khi có từ hai locale trở lên.

Chuỗi giao diện (nút, nhãn, thông báo lỗi) nằm trong `messages/vi.json`. Nội dung tour nằm trong content layer, không trộn hai thứ này.

## 6. Cấu trúc trang

### Trang chủ `/[locale]`

1. **Hero** — cinematic beat #1
2. **Vì sao chọn chúng tôi** — 3–4 điểm mạnh, reveal so le
3. **Tour nổi bật** — lưới thẻ tour, hover scale ảnh + trượt nội dung
4. **Hành trình** — cinematic beat #2
5. **Cảm nhận khách hàng** — trích dẫn + ảnh khách
6. **CTA cuối** — Zalo / điện thoại / form liên hệ

### Trang chi tiết tour `/[locale]/tour/[slug]`

1. Hero ảnh + tên tour + thông tin nhanh (thời lượng, giá từ, điểm đến)
2. Tổng quan
3. **Lịch trình theo ngày** — cinematic beat #3
4. Gallery
5. Bao gồm / Không bao gồm
6. CTA liên hệ

### Trang liên hệ `/[locale]/lien-he`

Form đơn giản (tên, số điện thoại, tour quan tâm, ghi chú) gửi email qua **Resend**. Không lưu database ở GĐ 1. CTA cuối trang chủ và CTA trang tour đều trỏ về trang này, mang theo `?tour=<slug>` để điền sẵn trường "tour quan tâm".

## 7. Hệ animation

### Ba cinematic beat (dùng GSAP ScrollTrigger)

1. **Hero trang chủ** — video pin toàn màn hình, scroll điều khiển tiến độ phát video (scrub), tiêu đề mask-reveal theo dòng, kết thúc bằng zoom-out thành trạng thái tĩnh rồi nhả pin.
2. **Hành trình** — pin section, scroll dọc điều khiển gallery điểm đến chạy ngang, mỗi điểm đến có nhãn fade vào khi tới vị trí.
3. **Lịch trình tour** — ảnh full-bleed parallax xen giữa các ngày, nội dung mỗi ngày reveal theo tiến độ scroll của khối đó.

### Token và quy ước

`src/lib/motion/tokens.ts` là nơi duy nhất định nghĩa:

- `duration`: 150 / 300 / 600 / 900 ms
- `easing`: `easeOutExpo` cho enter, `easeInOut` cho scrub, `easeOut` cho hover
- `stagger`: 60ms
- `distance`: khoảng dịch chuyển của reveal (24px)

**Chỉ animate `transform` và `opacity`.** Không animate `width`, `height`, `top`, `left`, `margin`, `filter` trong vòng lặp scroll — đây là nguyên nhân số một gây giật khung hình.

Component `<Reveal>` dùng chung cho mọi hiệu ứng vào-viewport. Không rải `whileInView` trực tiếp trong các section, vì như vậy timing sẽ trôi dạt mỗi nơi một kiểu và không sửa tập trung được.

### Ba tầng degradation

Phát hiện tại runtime, quyết định một lần và đưa vào React context:

| Tầng | Điều kiện | Hành vi |
|---|---|---|
| `reduced` | `prefers-reduced-motion: reduce` | Chỉ fade, không dịch chuyển, không pin, không scrub, tắt Lenis |
| `lite` | `pointer: coarse`, hoặc `deviceMemory <= 4`, hoặc `hardwareConcurrency <= 4` | Bỏ pin và scrub video; cinematic beat thoái hoá thành ảnh tĩnh + reveal; giữ hover/transition |
| `full` | còn lại | Đầy đủ |

Tầng `lite` là mặc định cho mobile. Cinematic scroll-telling trên mobile vừa tốn pin vừa dễ giật, và phần lớn lưu lượng du lịch tại Việt Nam là mobile — nên bản mobile phải được thiết kế như một trải nghiệm hoàn chỉnh riêng, không phải bản desktop bị cắt xén.

### Lenis + ScrollTrigger

Lenis chạy ở layout gốc, đẩy `ScrollTrigger.update` mỗi tick và khai báo `scrollerProxy` để hai bên không đánh nhau. Lenis bị tắt hoàn toàn ở tầng `reduced`.

## 8. Pipeline ảnh và video

### Ảnh

- Ảnh gốc đặt ở `assets-src/` — **không** commit lên repo deploy, không nằm trong `public/`
- Script `scripts/build-media.ts` dùng `sharp` sinh AVIF + WebP ở các bề rộng 640 / 1024 / 1600 / 2400 vào `public/media/`, đồng thời sinh blur placeholder base64 và ghi vào content JSON
- Hiển thị bằng `next/image` với **custom loader** trỏ tới các file đã sinh sẵn

Lý do dùng custom loader thay vì để Vercel tự tối ưu: Vercel tính phí theo số ảnh nguồn được biến đổi. Một site du lịch có hàng trăm ảnh sẽ chạm hạn mức nhanh. Sinh sẵn lúc build thì chi phí biến đổi bằng không, đổi lại build lâu hơn — đánh đổi này rõ ràng có lợi ở đây.

### Video

- Encode hai bản: H.264 `.mp4` (tương thích) và VP9 `.webm` (nhẹ hơn), kèm ảnh poster. Chọn VP9 thay vì AV1 vì encode nhanh hơn nhiều lần và hỗ trợ trình duyệt rộng hơn; cân nhắc AV1 lại khi thư viện video lớn hơn.
- **Video dùng để scrub phải encode keyframe dày** (`-g 1`, tức mọi frame là keyframe). Video thường có keyframe cách nhau 2–5 giây; tua tới vị trí bất kỳ sẽ phải giải mã lại từ keyframe gần nhất và gây giật rõ rệt. Đây là lỗi kinh điển của scroll-scrub video.
- Video scrub giới hạn **≤ 6 giây và ≤ 3 MB** sau khi encode. Keyframe dày làm file phồng lên rất nhanh, nên phải giới hạn độ dài.
- Video hero không scrub (chỉ autoplay loop) dùng encode thường, `muted`, `playsInline`, `preload="metadata"`.

## 9. Ràng buộc khi deploy Vercel

- **Image optimization:** vô hiệu hoá bằng custom loader như mục 8, tránh chi phí biến đổi ảnh.
- **Băng thông video:** file tĩnh trong `public/` phục vụ qua CDN của Vercel và tính vào hạn mức băng thông. Nếu tổng video vượt khoảng 50 MB hoặc lưu lượng tăng, chuyển video sang Vercel Blob hoặc Cloudflare R2 và trỏ URL trong content JSON. Schema media phải cho phép URL tuyệt đối ngay từ đầu để việc chuyển này không cần sửa code.
- **Rendering:** trang chủ và trang tour dùng static generation (`generateStaticParams`), không dùng SSR. Nội dung thay đổi hiếm, static cho LCP tốt nhất và chi phí function bằng không.
- **Form liên hệ:** một Route Handler duy nhất, có rate limit đơn giản theo IP và honeypot chống bot.
- Biến môi trường cho email API key khai báo trong Vercel project settings, không commit.

## 10. Tiêu chí nghiệm thu

| Chỉ số | Ngưỡng | Cách đo |
|---|---|---|
| LCP (mobile, 4G giả lập) | < 2.5s | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| INP | < 200ms | Lighthouse |
| FPS khi scroll qua cinematic beat | ≥ 55fps | chrome-devtools MCP performance trace |
| Lighthouse Performance (mobile) | ≥ 90 | Lighthouse |
| Bundle JS trang chủ (gzip) | < 200 KB | `next build` output |

Không tuyên bố "đã mượt" nếu chưa có số đo thật.

## 11. Kiểm thử

- **Vitest** cho `src/lib/content/` (schema validate, adapter trả đúng dữ liệu, báo lỗi rõ khi content sai) và cho logic phát hiện tầng degradation. Đây là logic thuần, viết test trước.
- **Trình duyệt thật** qua chrome-devtools MCP: screenshot ở các breakpoint 390 / 768 / 1440 / 1920, và performance trace cho mỗi cinematic beat.
- Animation không unit-test được. Nghiệm thu bằng performance trace (số) cộng ảnh chụp (mắt người duyệt).

## 12. Công cụ và skill

**Cần cài (người dùng thực hiện trong session tương tác):**

- `chrome-devtools` MCP — bắt buộc. Không có nó thì mục 10 không kiểm chứng được: `claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest`
- Kiểm tra `/plugin` xem có skill frontend nào phù hợp để cài thêm.

**Skill riêng của dự án, sẽ viết trong quá trình triển khai:**

- `motion-system` — token, quy ước animation, quy tắc degradation
- `image-pipeline` — chuẩn xử lý và nhúng ảnh/video
- `tour-content` — quy trình biến ảnh + text người dùng cung cấp thành content JSON hợp lệ

## 13. Rủi ro đã biết

| Rủi ro | Giảm thiểu |
|---|---|
| Scroll-scrub video giật trên máy yếu | Tầng `lite` bỏ scrub hoàn toàn; giới hạn 6s/3MB; keyframe dày |
| Lenis xung đột ScrollTrigger | Khai báo `scrollerProxy`, đồng bộ trong một `useEffect` duy nhất, viết sớm và kiểm chứng bằng trace |
| Ảnh gốc quá nặng làm LCP tệ | Sinh sẵn nhiều kích thước lúc build, blur placeholder, `priority` chỉ cho ảnh hero |
| Nội dung tour chưa sẵn sàng | Schema chặt + dữ liệu mẫu hợp lệ; không bịa nội dung tour thật |
| Phạm vi trôi sang GĐ 2/3 | Spec này giới hạn rõ; đề xuất CMS/đặt tour bị từ chối ở GĐ 1 |

## 14. Điều kiện chuyển sang GĐ 2

GĐ 1 xong khi: trang chủ và ít nhất 2 trang tour có nội dung thật đã deploy trên Vercel, mọi ngưỡng ở mục 10 đạt, và không component nào truy cập content layer vòng qua `index.ts`.
