# Thiết kế: RosaTravel Giai đoạn 2 — Cắm CMS

- **Ngày:** 2026-09-07
- **Trạng thái:** Đã duyệt, sẵn sàng lập implementation plan
- **Tiền đề:** [Spec GĐ1](2026-09-06-travel-landing-page-design.md) đã hoàn thành 15 task, review cuối và đợt sửa

## 1. Mục tiêu

Chủ dự án và 1–2 nhân viên không rành kỹ thuật tự thêm và sửa tour qua giao diện web, không cần lập trình viên, không đụng tới JSON hay git.

Thành công nghĩa là: một nhân viên chưa từng thấy dự án này có thể tạo một tour mới hoàn chỉnh — tiêu đề, lịch trình từng ngày, ảnh, giá, mục bao gồm — và thấy nó xuất hiện trên trang trong vòng vài giây, chỉ bằng cách nhìn màn hình mà không cần hỏi ai.

## 2. Phạm vi

**Có:** Payload CMS nhúng trong app, mô hình dữ liệu cho tour và nội dung trang chủ, adapter thay `fs.ts`, upload ảnh kèm sinh biến thể tự động, đăng-là-thấy-ngay, tài khoản cho nhân viên, chuyển nội dung hiện có sang CMS, dọn những gì không còn dùng.

**Không có:** luồng đặt tour và lưu đơn hàng (GĐ3), đa ngôn ngữ, phân quyền chi tiết theo vai trò, quy trình duyệt trước khi đăng, pipeline video (vẫn hoãn từ GĐ1 vì chưa có ffmpeg).

## 3. Nền tảng và lý do chọn

**Payload CMS v3 + MongoDB Atlas + Vercel Blob.**

Payload chạy trong chính app Next.js, giao diện quản trị ở `/admin`. Dữ liệu trong MongoDB Atlas (bản M0 miễn phí). Ảnh trong Vercel Blob.

### Vì sao không phải Sanity

Sanity là đường ngắn nhất tới một CMS dùng được: ảnh, CDN và ảnh mờ giữ chỗ đều có sẵn miễn phí. Bị loại vì hai lý do:

- **Nó không phục vụ được GĐ3.** Đơn đặt tour cần một database, và Sanity không làm việc đó. Chọn Sanity nghĩa là chấp nhận hai nhà cung cấp ở giai đoạn sau — trong khi lập luận chính để chọn nó là "ít dịch vụ phải trông".
- **Nó buộc phải vứt bỏ pipeline ảnh của GĐ1.** GĐ1 xây dựng việc sinh sẵn biến thể AVIF để chi phí biến đổi ảnh trên Vercel bằng không. Sanity thay thế bằng CDN riêng, đổi một khoản chi phí lấy một khoản khác.

### Vì sao không phải Supabase một mình

Supabase là database, không phải CMS. Giao diện quản trị của nó là bảng kiểu Excel. Nhân viên sẽ phải gõ lịch trình vào một ô JSON thô, hoặc đi qua năm bảng và tự nối khoá ngoại, hoặc copy URL ảnh giữa hai màn hình. Đó là lùi so với sửa file JSON.

### Vì sao MongoDB chứ không phải Postgres

Nội dung tour là dữ liệu **dạng tài liệu**: lịch trình lồng nhau, mảng ảnh, mảng mục bao gồm. Nó sinh ra từ file JSON và schema zod mô tả đúng một tài liệu.

Postgres qua Payload sẽ tách một tour thành khoảng tám bảng nối nhau. Chạy vẫn đúng, nhưng dữ liệu mất đi hình dạng vốn có của nó, và bất kỳ ai mở database ra nhìn cũng sẽ không hiểu ngay.

Lập luận "Postgres tốt hơn cho đơn hàng ở GĐ3" đúng khi có giao dịch phức tạp và báo cáo nặng. Với vài trăm đơn mỗi năm, một đơn cũng chỉ là một tài liệu; ưu thế đó gần như chỉ tồn tại trên lý thuyết ở quy mô này.

**Đánh đổi đã chấp nhận:** MongoDB Atlas chỉ cho database, nên ảnh phải để nơi khác. Nơi khác đó là Vercel Blob — cùng tài khoản Vercel đã dùng để deploy, nên vẫn là hai nơi nhưng đều là dịch vụ đã có sẵn.

**Cần kiểm khi triển khai:** hạn mức và chính sách hiện hành của MongoDB Atlas M0 và Vercel Blob. Các con số này thay đổi theo thời gian và không được ghi cứng vào spec.

## 4. Kiến trúc — ranh giới không đổi

Đây là điều kiện GĐ1 được xây dựng để phục vụ, và GĐ2 phải chứng minh nó đúng.

```
src/lib/content/schema.ts    GIỮ NGUYÊN — vẫn là nguồn chân lý về hình dạng dữ liệu
src/lib/content/guards.ts    GIỮ NGUYÊN
src/lib/content/index.ts     Đổi đúng bốn dòng re-export
src/lib/content/cms.ts       MỚI — đọc từ Payload, ánh xạ, validate bằng zod
src/lib/content/fs.ts        XOÁ
```

Bốn hàm phải giữ nguyên chữ ký: `getTours()`, `getTour(slug)`, `getTourSlugs()`, `getHomeContent()`.

**Không component nào được sửa.** Nếu một component phải đổi, ranh giới đã rò rỉ và đó là lỗi cần sửa ở tầng adapter, không phải ở component.

### Cách `cms.ts` đọc dữ liệu

Payload v3 có **Local API** — gọi thẳng trong tiến trình, không qua HTTP. `cms.ts` dùng nó, không dùng REST hay GraphQL.

Điều này quan trọng vì `generateStaticParams` và các trang tĩnh chạy lúc build: gọi HTTP tới chính mình lúc build là một vòng lặp không đáng có. Local API đọc thẳng từ database.

### zod ở lại, và đây là quyết định có chủ đích

`cms.ts` không tin dữ liệu từ Payload. Nó lấy về, ánh xạ sang hình dạng nội bộ, rồi **validate bằng chính schema zod hiện có**.

Lý do: mô hình dữ liệu Payload và schema zod là hai thứ được viết tay để khớp nhau, và không có gì tự động giữ chúng khớp. Nếu ai đó thêm một trường bên Payload hoặc đổi kiểu một trường, không có zod thì lỗi sẽ biểu hiện thành trang trắng hoặc `undefined` hiện ra giữa giao diện. Có zod thì build vỡ ngay kèm tên trường sai.

## 5. Mô hình dữ liệu

Ba collection trong Payload:

**`tours`** — khớp một-một với `tourSchema` hiện có: `slug`, `title`, `tagline`, `summary`, `durationDays`, `priceFrom`, `currency`, `destinations`, `heroMedia`, `gallery`, `itinerary`, `inclusions`, `exclusions`, `notes`, `seo`.

**`home`** — global (chỉ một bản ghi), khớp `homeContentSchema`: `hero`, `whyUs`, `featuredTours`, `journey`, `testimonials`, `contact`.

**`media`** — ảnh, có upload. Mỗi bản ghi mang thêm `blurDataURL` và các biến thể kích thước do hook sinh ra.

**Ràng buộc chuyển tiếp:** mọi trường văn bản hướng người đọc hiện đang bọc theo ngôn ngữ (`{ vi: "..." }`). Payload có cơ chế localization riêng. GĐ2 **giữ nguyên cách bọc thủ công** thay vì chuyển sang localization của Payload — đổi cả hai thứ cùng lúc sẽ khiến không phân biệt được lỗi đến từ đâu. Chuyển sang localization của Payload là việc của giai đoạn bật tiếng Anh.

**`featuredTours`** trong Payload là **quan hệ thật** tới `tours` thay vì mảng chuỗi. Điều này loại bỏ hẳn lỗi trỏ tới tour không tồn tại mà GĐ1 phải viết test riêng để bắt — người nhập chọn tour từ danh sách, không gõ slug.

Schema zod **không đổi**: `homeContentSchema` vẫn khai `featuredTourSlugs` là mảng chuỗi. Việc chuyển quan hệ thành mảng slug là nhiệm vụ của `cms.ts`. Đây đúng là loại việc mà tầng adapter sinh ra để làm — mô hình lưu trữ và hình dạng UI cần không nhất thiết phải giống nhau.

## 6. Ảnh

Payload dùng `sharp` để sinh nhiều kích thước lúc upload — chính thư viện GĐ1 đang dùng. Logic pipeline của GĐ1 không bị vứt đi; nó chuyển từ script chạy tay thành hook chạy tự động.

- Sinh biến thể ở bốn bề rộng 640/1024/1600/2400, định dạng AVIF và WebP
- Sinh `blurDataURL` bằng đúng đoạn code trong `scripts/build-media.ts` hiện tại
- Sinh riêng một bản JPEG 1200×630 không hậu tố cho ảnh chia sẻ mạng xã hội — Zalo và Facebook không đọc được AVIF trong link preview
- Cảnh báo trong giao diện admin khi ảnh gốc rộng dưới 2400px

**Giữ được tính chất chi phí biến đổi ảnh bằng không:** biến thể sinh sẵn một lần lúc upload, sau đó chỉ là file tĩnh trên Vercel Blob. Vercel không phải biến đổi gì.

`src/lib/media/loader.ts` giữ nguyên vai trò: ánh xạ bề rộng yêu cầu sang URL biến thể có sẵn. Chỉ đổi quy ước tên file — từ hậu tố `-640` của script cũ sang cách Payload đặt tên. Bộ test hiện có ở lại, các giá trị kỳ vọng cập nhật theo quy ước mới; ba cái bẫy nó đang bảo vệ (URL tuyệt đối đi thẳng, không thêm hậu tố hai lần, đường dẫn có dấu chấm trong tên thư mục) vẫn nguyên giá trị.

## 7. Đăng là thấy ngay

Payload chạy cùng tiến trình với Next.js, nên không cần webhook. Hook `afterChange` trên `tours` và `home` gọi thẳng `revalidatePath` cho những đường dẫn bị ảnh hưởng.

Sửa một tour làm mới trang tour đó và trang chủ (vì tour có thể đang nằm trong danh sách nổi bật). Sửa `home` làm mới trang chủ.

Trang vẫn sinh tĩnh, vẫn giữ được tốc độ đã đo ở GĐ1.

## 8. Tài khoản

Payload tự quản lý người dùng, không cần dịch vụ đăng nhập thứ ba. Người đầu tiên tạo tài khoản qua màn hình khởi tạo của Payload; những người sau được mời từ trong admin.

GĐ2 không làm phân quyền theo vai trò — mọi người đều sửa được mọi thứ. Với ba người trong cùng một công ty, phân quyền là phức tạp thừa. Thêm khi thực sự cần.

## 8b. Biến môi trường mới

| Biến | Dùng để | Thiếu thì sao |
|---|---|---|
| `DATABASE_URI` | Chuỗi kết nối MongoDB Atlas | Build vỡ kèm thông báo tiếng Việt (mục 12) |
| `PAYLOAD_SECRET` | Ký phiên đăng nhập của admin | Payload từ chối khởi động |
| `BLOB_READ_WRITE_TOKEN` | Ghi ảnh lên Vercel Blob | Upload ảnh hỏng, phần còn lại chạy |

Cả ba phải đặt trong Vercel Project Settings **trước lần deploy đầu tiên**, cùng chỗ với `NEXT_PUBLIC_SITE_URL` mà GĐ1 đã yêu cầu.

## 9. Chuyển nội dung hiện có

Một script chạy một lần, đọc `content/home.json` và `content/tours/*.json` rồi ghi vào Payload.

Nội dung hiện tại phần lớn là dữ liệu mẫu (ảnh giữ chỗ, số điện thoại `0900000000`), nên giá trị thật của script này không phải là di trú dữ liệu — mà là **kiểm chứng rằng mô hình Payload nhận được đúng hình dạng mà zod chấp nhận**. Nó là một phép thử đầu-cuối cho mục 5, viết dưới dạng script.

## 10. Những gì bị xoá

`src/lib/content/fs.ts`, `content/home.json`, `content/tours/*.json`, `content/media-manifest.json` (nếu có), `scripts/build-media.ts`, `scripts/build-placeholders.ts`, các lệnh `pnpm media` và `pnpm placeholders`.

**`sharp` ở lại.** Logic xử lý ảnh ở lại, chỉ đổi nơi gọi.

Hai bộ test `fs.test.ts` và `og-image.test.ts` mất đối tượng kiểm tra. Thay bằng test cho phần ánh xạ Payload → hình dạng nội bộ, chạy trên dữ liệu mẫu cố định, không gọi mạng và không cần database.

## 11. Kiểm thử

- **Ánh xạ dữ liệu** (`cms.ts`): hàm thuần biến một document Payload thành hình dạng nội bộ. Test bằng dữ liệu mẫu — đây là phần dễ sai nhất và cũng dễ test nhất.
- **Loader ảnh**: giữ nguyên bộ test hiện có, cập nhật theo quy ước tên file mới.
- **Hook sinh ảnh mờ**: test rằng chuỗi sinh ra là data URL hợp lệ.
- Không viết test gọi vào database thật. Nếu một lỗi chỉ lộ khi có database, nó thuộc về bước kiểm chứng thủ công chứ không phải bộ test.

## 12. Rủi ro

| Rủi ro | Đánh giá |
|---|---|
| **Build phụ thuộc database** — rủi ro mới, GĐ1 không có | Sinh trang tĩnh cần đọc Mongo. Mongo không truy cập được thì build vỡ. Xử lý bằng thông báo lỗi tiếng Việt rõ ràng, giống cách đã làm với `NEXT_PUBLIC_SITE_URL` |
| Hạn mức Vercel Blob | Chỗ dễ chạm trần nhất khi ảnh tour thật nhiều lên. Cần theo dõi sau khi có nội dung thật |
| Hạn mức MongoDB Atlas M0 | Nội dung chữ rất nhẹ, ảnh không nằm ở đây. Khó chạm trần |
| Mô hình Payload và schema zod lệch nhau | Chính là lý do giữ zod ở mục 4 |
| Payload làm nặng quá trình build | Route admin tách riêng, không vào bundle của khách. Cần kiểm lại số đo ở mục 13 |
| Bản miễn phí đổi chính sách | Dữ liệu nằm trong Mongo của bạn, xuất được. Không khoá cứng |

## 13. Tiêu chí hoàn thành

1. Một người chưa từng thấy dự án tạo được một tour hoàn chỉnh qua `/admin`, và tour đó hiện trên site trong vòng vài giây.
2. **Không component nào bị sửa.** Kiểm bằng `git diff --stat src/components` — phải rỗng.
3. Mọi ngưỡng hiệu năng của GĐ1 vẫn đạt, đo lại bằng đúng cách đã đo: Lighthouse Performance ≥ 90 mobile, LCP < 2.5s, CLS < 0.1, bundle trang chủ < 200 KB.
4. Bộ test xanh, output sạch.
5. Build vỡ với thông báo tiếng Việt rõ ràng khi thiếu biến môi trường database, thay vì vỡ khó hiểu.
6. Xoá xong những gì ở mục 10; không còn file mồ côi.

## 14. Điều kiện chuyển sang GĐ3

GĐ2 xong khi nội dung thật đã được nhập qua `/admin` và site chạy trên production với dữ liệu đó. GĐ3 (luồng đặt tour) dùng lại chính MongoDB này để lưu đơn hàng.
