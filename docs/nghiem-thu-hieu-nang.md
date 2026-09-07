# Nghiệm thu hiệu năng — Task 15 (một phần)

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
