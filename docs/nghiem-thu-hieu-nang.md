# Nghiệm thu hiệu năng — Task 15 (một phần)

## Cập nhật 2026-09-07 — nghiệm thu GĐ2 (Task 11)

Task 11 là task cuối của Giai đoạn 2 (thêm CMS Payload + MongoDB). Task này không thêm tính năng — nó chứng minh GĐ2 không phá vỡ những gì GĐ1 đã đạt, và ghi lại số đo thật.

### Ràng buộc trung tâm: `src/components` không đổi ngoài Task 10

Tiêu chí số 2 trong spec GĐ1 là các component hiển thị không được biết tới CMS. Kiểm bằng:

```
git diff --stat aadcda3..HEAD -- src/components
```

Kết quả:

```
 src/components/home/JourneyCinematic.tsx | 6 +++---
 1 file changed, 3 insertions(+), 3 deletions(-)
```

Đúng một file, chỉ đổi 3 dòng, toàn bộ là sửa comment (không đổi logic hay JSX): comment cũ nhắc tới `content/home.json` — file đã bị xoá khi GĐ2 chuyển dữ liệu sang Payload — được sửa ở Task 10 (đã được uỷ quyền) thành nhắc tới "global home trong Payload". Ràng buộc kiến trúc GĐ1 (component hiển thị không phụ thuộc nguồn dữ liệu cụ thể) vẫn được giữ nguyên qua toàn bộ GĐ2.

### Build vỡ đúng cách khi thiếu `MONGODB_URI`

Hàm `required()` trong `src/payload.config.ts:21-30` dùng `if (!value)`, nên chuỗi rỗng bị coi như biến thiếu, không chỉ biến vắng mặt hoàn toàn. Nhờ vậy kiểm được hành vi mà **không cần sửa `.env.local`** (file chứa thông tin kết nối thật) — Next.js không ghi đè biến đã có sẵn trong `process.env`, nên:

```bash
MONGODB_URI= pnpm build
```

đủ để mô phỏng biến thiếu, giữ nguyên `.env.local` không đụng tới. Kết quả: build dừng ở bước "Collecting page data" với:

```
Error: MONGODB_URI chưa được đặt. Đây là chuỗi kết nối MongoDB Atlas — lấy ở Atlas → Connect → Drivers.
Đặt trong .env.local khi phát triển, và trong Vercel Project Settings → Environment Variables trước khi deploy.
```

Đây đúng là thông báo tiếng Việt từ `payload.config.ts`, nói rõ phải làm gì và lấy giá trị ở đâu — không phải lỗi driver Mongo khó hiểu (không có `MongooseError`, không có stack trace của driver kết nối). Sau khi kiểm xong, chạy lại `pnpm build` bình thường (biến thật vẫn nguyên trong `.env.local`, không bị đụng) để xác nhận build thành công trở lại — xác nhận đúng như vậy (xem bảng bundle bên dưới, đo ngay sau lần build phục hồi này).

### Số đo hiệu năng GĐ2, đặt cạnh GĐ1

Đo cùng phương pháp GĐ1: `pnpm build` + `pnpm start -p 3100`, Lighthouse CLI (`lighthouse@latest`), Chrome headless (`--headless=new --no-sandbox --disable-gpu`), `throttling-method=simulate`. Ngày đo: 2026-09-07. Commit: `e7cb1bc` (nhánh `feat/gd1-landing-page`). JSON kết quả: `.superpowers/perf/lh-gd2-mobile.json`, `.superpowers/perf/lh-gd2-desktop.json` (không commit — thư mục này bị gitignore).

**Mobile** (`form-factor=mobile`, `--screenEmulation.mobile`):

| Chỉ số | Ngưỡng | GĐ1 (mốc "sau") | GĐ2 (Task 11) | Đạt/Không đạt |
|---|---|---|---|---|
| Performance | ≥ 90 | 99 | **98** | Đạt |
| Accessibility | không tụt dưới 98 | 98 | **98** | Đạt (giữ nguyên) |
| LCP | < 2.5s | 2.0s | **2.3s** | Đạt |
| CLS | < 0.1 | 0 | **0** (0.00021) | Đạt |
| Total Blocking Time | — | 0 ms | **10 ms** | — |
| FCP | — | 0.8s | **1.2s** | — |

**Desktop** (`--preset=desktop`):

| Chỉ số | GĐ1 | GĐ2 (Task 11) |
|---|---|---|
| Performance | 100 | **100** |
| Accessibility | 98 | **98** |
| LCP | 0.6s | **0.6s** |
| CLS | 0 | **0** (0.000036) |
| TBT | 0 ms | **0 ms** |

**Về chênh lệch LCP/Performance mobile (2.0s→2.3s, 99→98):** cả hai vẫn đạt ngưỡng rõ ràng (2.3s < 2.5s, 98 ≥ 90), và mục cập nhật GĐ1 ở trên đã ghi nhận là số đo cùng một commit dao động 2.0s–2.9s và score 95–99 tuỳ tải hệ thống tại thời điểm đo (xem đoạn "sau đợt sửa lỗi review toàn nhánh" phía trên) — máy đo này không cách ly được khỏi tải nền. Số đo GĐ2 nằm gọn trong khoảng dao động đã biết đó, nên **không được coi là bằng chứng chắc chắn của regression** do GĐ2 gây ra, nhưng cũng không bị làm tròn hay bỏ qua ở đây — ghi đúng như đo được.

**Accessibility — audit chưa đạt:** `heading-order` vẫn ở điểm 0 trên cả mobile và desktop, giống hệt GĐ1 (lỗi có sẵn từ trước, ngoài phạm vi task này).

### Bundle JS trang chủ

Từ output `pnpm build`:

```
Route (app)                                 Size  First Load JS
├ ● /[locale]                            3.05 kB         170 kB
├   └ /vi
├ ƒ /admin/[[...segments]]                 390 B         586 kB
```

| | GĐ1 | GĐ2 (Task 11) | Ngưỡng |
|---|---|---|---|
| Bundle trang chủ (`/vi`, First Load JS) | 167 kB | **170 kB** | < 200 kB — Đạt |
| Bundle route `/admin` | (chưa tồn tại) | 586 kB | tách riêng khỏi route công khai |

Bundle trang chủ tăng 3 kB (167→170 kB) dù toàn bộ Payload (CMS + admin UI + Lexical editor) đã được thêm vào dự án ở GĐ2 — mức tăng nhỏ hơn nhiều so với dự đoán "bundle sẽ tăng" trong brief. Lý do: Payload chạy ở phía server (Local API trong React Server Component khi lấy dữ liệu cho `/vi`), không đóng gói vào bundle JS gửi cho trình duyệt. Route `/admin/[[...segments]]` (giao diện quản trị, bao gồm Lexical editor và toàn bộ UI Payload) nặng 586 kB nhưng là **route riêng, code-split hoàn toàn khỏi các route công khai** — người dùng vào `/vi`, `/vi/lien-he`, `/vi/tour/[slug]` không tải bất kỳ phần nào của bundle admin. Không có dấu hiệu rò rỉ code admin vào bundle khách.

### Nội dung mẫu — chưa thay bằng nội dung thật

**Toàn bộ số đo ở trên (Task 11, GĐ2) vẫn được đo với nội dung mẫu — giống cảnh báo đã ghi ở GĐ1:** ảnh placeholder (khối màu phẳng AVIF, vài KB/ảnh) chứ không phải ảnh tour thật; số điện thoại, Zalo, email trong site vẫn là dữ liệu mẫu, chưa phải thông tin liên hệ thật của chủ site. Mục "nội dung mẫu đã thay bằng nội dung thật" trong checklist cuối GĐ2 **cố ý chưa thực hiện trong task này** — việc này phụ thuộc chủ site cung cấp số điện thoại, Zalo, email và ảnh tour thật, hiện chưa có. Khi nội dung thật (đặc biệt ảnh tour nặng hơn nhiều so với placeholder) được đưa vào, **LCP gần như chắc chắn tăng trở lại và phải đo lại** trước khi coi ngưỡng LCP đạt cho bản phát hành thật — đúng cảnh báo đã ghi ở GĐ1, vẫn còn nguyên giá trị.

### Kết luận GĐ2

Không chỉ số nào trong 2 giai đoạn (Performance, Accessibility, LCP, CLS, bundle) bị fail. Ràng buộc kiến trúc trung tâm (`src/components` không phụ thuộc CMS) được giữ nguyên qua toàn bộ GĐ2, chỉ một sửa đổi comment 3 dòng được uỷ quyền ở Task 10. Build vỡ đúng cách và có thông báo tiếng Việt rõ ràng khi thiếu `MONGODB_URI`. `pnpm test` 69/69 xanh. Hạng mục còn treo, không thuộc phạm vi kỹ thuật của task này: thay nội dung mẫu bằng nội dung thật (chủ site cung cấp) và đo FPS khi cuộn cinematic (cần công cụ profiling chưa cài đặt, đã ghi từ GĐ1).

---

## Cập nhật 2026-09-07 — sau đợt sửa lỗi review toàn nhánh

**Accessibility (Lighthouse, mobile, `/vi`):** điểm **0.98**. Audit `color-contrast` đạt tuyệt đối (1.0) sau khi nâng `--color-ink-500` (3.48:1 → 5.53:1) và `--color-clay-500` (3.92:1 → 5.91:1); tách riêng `--color-clay-600` (6.13:1) làm nền cho 4 nút CTA vì bản thân `--color-clay-500` mới sáng hơn không còn đủ tương phản khi dùng làm nền với chữ sáng. Audit còn lại chưa đạt: `heading-order` (thứ tự heading không tuần tự) — lỗi có sẵn từ trước, không liên quan tới đợt sửa màu sắc này, không nằm trong phạm vi đợt sửa.

**Performance (Lighthouse, mobile, `/vi`, simulated throttling), đo sau toàn bộ 8 nhóm sửa lỗi:** 3 lần đo liên tiếp cho **score 0.95–0.96, LCP 2.6–2.8s, FCP 1.7s** — cao hơn hẳn con số "sau" 99/2.0s/0.8s ghi ở bảng dưới. Để loại trừ khả năng đợt sửa lỗi này gây regression thật, đã dựng lại đúng commit `b344429` (điểm mốc "sau" gốc) trong một git worktree riêng và đo lại **dưới cùng điều kiện máy hiện tại**: kết quả **score 0.95, LCP 2.9s, FCP 1.7s** — gần như giống hệt số đo sau khi sửa. Kết luận: chênh lệch so với bảng gốc là do **tải hệ thống của máy đo tại thời điểm đo, không phải do các thay đổi trong đợt sửa lỗi này** — 8 nhóm sửa lỗi (site.ts, og-image, màu sắc, contact route, ContactForm, next-intl Link, tier flash, React key/sizes/JSON-LD) không đổi bundle JS trang chủ theo hướng đáng kể (167kB → 169kB, do thêm `src/i18n/navigation.ts` cho 4 chỗ Link). Số liệu trong bảng gốc bên dưới **không được thay thế** — giữ nguyên làm mốc tham chiếu vào ngày đo gốc; số đo lại hôm nay được ghi nhận riêng ở đây vì môi trường đo không lặp lại được cùng điều kiện tải hệ thống.

File JSON kết quả các lần đo: `.superpowers/perf/lh-a11y.json` (accessibility), `.superpowers/perf/lh-home-mobile-final.json`, `-final2.json`, `-final3.json` (performance sau sửa), `lh-baseline-check.json` (đo lại b344429 dưới cùng điều kiện để đối chứng).

## Điều kiện đo

- Công cụ: Lighthouse CLI (`lighthouse@latest`, v13.4.1), Chrome headless (`--headless=new --no-sandbox --disable-gpu`).
- Cấu hình: `form-factor=mobile`, `screenEmulation.mobile`, `throttling-method=simulate` (giả lập mạng 4G/CPU theo mô hình simulate của Lighthouse, không phải throttle vật lý).
- Đối tượng đo: bản build production (`pnpm build` + `pnpm start -p 3100`), chạy tại `http://localhost:3100/vi`.
- Ngày đo "trước": 2026-09-06. Ngày đo "sau": 2026-09-07.
- Commit "trước": HEAD `bf00014` (nhánh `feat/gd1-landing-page`).
- Commit "sau": sau khi bớt 2 weight font không dùng (xem mục Thay đổi bên dưới).

## Bảng kết quả

| Chỉ số | Ngưỡng | Đo được (trước) | Đo được (sau) | Đạt/Không đạt |
|---|---|---|---|---|
| Lighthouse Performance (mobile) | ≥ 90 | 93 | 99 | Đạt |
| LCP (mobile, simulated 4G) | < 2.5s | 2.9s | 2.0s | Đạt |
| CLS | < 0.1 | 0 | 0 | Đạt |
| Total Blocking Time (proxy cho INP) | INP < 200ms | 50 ms | 0 ms | Đạt |
| Bundle JS trang chủ (gzip, First Load JS) | < 200 kB | 167 kB | 167 kB | Đạt (không đổi — thay đổi chỉ ở font, không ở JS) |
| FPS khi cuộn cinematic | ≥ 55fps | — | — | **Chưa đo** (xem ghi chú bên dưới) |

Số liệu bổ sung: FCP trước = 2.0s, FCP sau = 0.8s. Tổng dung lượng font woff2 (`.next/static/media/*.woff2`): trước = 196 KB (10 file), sau = 124 KB (10 file — vẫn 10 file vì Next.js còn tách theo unicode-range trong mỗi subset, nhưng tổng dung lượng giảm vì bớt 2 weight).

## Thay đổi đã thực hiện

Trong `src/app/[locale]/layout.tsx`:

- `Be_Vietnam_Pro`: `weight: ['400', '500', '600']` → `weight: ['400', '500']`. Đã grep toàn bộ `src/` xác nhận không có `font-semibold` hay `font-bold` ở đâu (weight 600/700 không được dùng).
- `Playfair_Display`: `weight: ['400', '600']` → `weight: ['400']`. Đã kiểm tra toàn bộ nơi dùng `font-playfair` (11 vị trí trong `src/`) — không nơi nào gắn thêm class weight, nên chỉ weight 400 mặc định từng được render.
- Không đổi `subsets`, `variable`, hay `display: 'swap'`.

Nguyên nhân LCP fail (đã chẩn đoán trước, không đo lại): LCP element là chữ (hero headline), không phải ảnh. FCP vẽ chữ dự phòng (fallback) do `display: 'swap'`, sau đó font Playfair Display tải xong và vẽ lại — lần vẽ lại này trở thành LCP. Giảm số weight cần tải giúp font tới sớm hơn, rút ngắn khoảng cách FCP→LCP.

## Kết luận

LCP đã đạt ngưỡng sau khi bớt 2 weight font (2.9s → 2.0s), đồng thời Performance score, FCP và TBT đều cải thiện. Không có phần nào trong 5 chỉ số đã đo mà bị fail sau thay đổi.

## Lựa chọn chưa áp dụng — `display: 'optional'`

Có thể đổi `display: 'swap'` → `'optional'` để loại bỏ hoàn toàn hiện tượng vẽ lại font (font chỉ dùng nếu tải kịp trong một khoảng thời gian ngắn, nếu không thì giữ nguyên fallback vĩnh viễn cho lần tải đó). Điều này sẽ cải thiện LCP hơn nữa nhưng có đánh đổi: người dùng mạng chậm sẽ **không bao giờ thấy font hiển thị thương hiệu (Playfair Display / Be Vietnam Pro)** trong phiên đó, kể cả khi mạng chậm chỉ tạm thời. Đây là quyết định sản phẩm/thương hiệu, chưa thực hiện trong task này — cần người phụ trách quyết định.

## Cảnh báo quan trọng — ảnh placeholder

**Các số liệu ở trên (đặc biệt là LCP) được đo với ảnh placeholder là các khối màu phẳng (flat-colour AVIF), dung lượng vài KB mỗi ảnh — KHÔNG PHẢI ảnh tour du lịch thật.** Khi ảnh thật (ảnh chụp phong cảnh, dung lượng lớn hơn nhiều, có thể có LCP là ảnh thay vì chữ) được đưa vào, LCP gần như chắc chắn sẽ tăng trở lại và **phải được đo lại** trước khi coi ngưỡng LCP là đạt cho bản phát hành thật.

## FPS khi cuộn cinematic — chưa đo

Ngưỡng "≥ 55fps khi cuộn cinematic" **chưa được đo** trong task này. Lý do: phép đo này cần công cụ profiling frame-rate thời gian thực (MCP `chrome-devtools`), hiện chưa được cài đặt trong môi trường này. Không được coi chỉ số này là đạt hay không đạt — cần cài công cụ và đo riêng ở một task khác.

## Bổ sung: đo trên desktop (tier `full`)

Review cuối toàn nhánh chỉ ra rằng mọi phép đo trước đó đều chạy `form-factor=mobile`, mà mobile rơi vào tier `lite` — nghĩa là **toàn bộ nhánh code `full`** (hero pin, hành trình cuộn ngang, parallax lịch trình) **chưa từng được đo bởi bất cứ thứ gì**. Đây là lỗ hổng đo lường lớn hơn cả phần FPS chưa đo.

Đo ngày 2026-09-07, Lighthouse CLI `--preset=desktop`, headless Chrome, trên bản production tại localhost:

| Chỉ số | Đo được |
|---|---|
| Performance | **100** |
| Accessibility | **98** |
| First Contentful Paint | 0.4s |
| Largest Contentful Paint | **0.6s** |
| Cumulative Layout Shift | **0** |
| Total Blocking Time | 0 ms |

**Về CLS = 0 trên desktop:** review cuối dự đoán một layout shift đáng kể do `JourneyCinematic` render nhánh `lite` phía server rồi đổi sang dải cuộn ngang khi client đo xong tier. Phép đo cho CLS bằng 0 — nhưng **điều đó không có nghĩa là cú đổi bố cục không xảy ra**. Nó nằm dưới màn hình đầu, và CLS chỉ tính những dịch chuyển trong khung nhìn. Cú đổi vẫn có thật; nó chỉ không bị CLS phạt.

**Vẫn chưa đo:** FPS ≥ 55 khi cuộn qua ba cinematic beat. Lighthouse đo tải trang, không đo khung hình trong lúc cuộn. Cần `chrome-devtools` MCP hoặc một performance trace thủ công.
