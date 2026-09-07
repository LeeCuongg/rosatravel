# RosaTravel GĐ2 — Cắm CMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chủ dự án và 1–2 nhân viên không rành kỹ thuật tự thêm và sửa tour qua `/admin`, thấy kết quả trên site trong vài giây, không đụng JSON hay git.

**Architecture:** Payload CMS v3 chạy trong chính app Next.js này, dữ liệu trong MongoDB Atlas, ảnh trong Vercel Blob. Tầng `src/lib/content/` giữ nguyên interface bốn hàm; chỉ thay implementation từ đọc file sang đọc Payload qua Local API, và **vẫn validate bằng schema zod hiện có**. Không component nào được sửa.

**Tech Stack:** Payload CMS v3, MongoDB Atlas (M0), Vercel Blob, sharp (đã có), zod (đã có), Next.js 15 App Router, Vitest.

**Spec nguồn:** [`docs/superpowers/specs/2026-09-07-cms-payload-mongodb-design.md`](../specs/2026-09-07-cms-payload-mongodb-design.md)

---

## Lưu ý quan trọng về độ tin cậy của code mẫu trong plan này

Plan này có **hai loại code**, và bạn phải đối xử với chúng khác nhau:

**1. Code của dự án — chép nguyên văn.** Hàm ánh xạ, tích hợp zod, loader ảnh, mọi test. Những đoạn này viết dựa trên schema và codebase có thật, đã được đọc và đối chiếu. Dùng y nguyên.

**2. Cấu hình và API của Payload — PHẢI đối chiếu tài liệu.** Tên package adapter, hình dạng `payload.config.ts`, chữ ký hook, cách gọi Local API. Plan mô tả **kết quả cần đạt** và các ràng buộc riêng của dự án, nhưng **không khẳng định cú pháp chính xác**. Payload v3 còn thay đổi nhanh, và một đoạn code sai được viết tự tin sẽ khiến bạn mất nhiều giờ hơn là không có gì.

Với loại 2: đọc tài liệu chính thức của Payload cho phiên bản bạn vừa cài, làm cho nó chạy, rồi đối chiếu lại **kết quả** với yêu cầu ghi trong task. Nếu tài liệu mâu thuẫn với plan, **tài liệu thắng** — báo lại để cập nhật plan.

---

## Global Constraints

- **Package manager:** `pnpm`. Không dùng npm/yarn.
- **Ranh giới content layer là ràng buộc trung tâm của cả giai đoạn:** `src/lib/content/index.ts` đổi đúng bốn dòng re-export. `schema.ts` và `guards.ts` **không đổi một ký tự**. **Không component nào trong `src/components/` được sửa** — kiểm bằng `git diff --stat src/components`, phải rỗng ở cuối giai đoạn.
- **zod ở lại:** `cms.ts` phải validate mọi dữ liệu lấy từ Payload bằng chính schema zod hiện có, trước khi trả về. Không tin dữ liệu từ CMS.
- **Local API:** `cms.ts` đọc Payload bằng Local API trong tiến trình, không qua HTTP. Gọi HTTP tới chính mình lúc build là vòng lặp không đáng có.
- **Bọc locale thủ công giữ nguyên:** mọi trường văn bản hướng người đọc vẫn là `{ vi: "..." }`. **Không** chuyển sang cơ chế localization của Payload trong giai đoạn này.
- **Ảnh:** biến thể sinh sẵn lúc upload bằng sharp, không biến đổi lúc chạy. Giữ tính chất chi phí biến đổi ảnh trên Vercel bằng không.
- **Rendering:** trang chủ và trang tour vẫn sinh tĩnh. Không dùng `dynamic = 'force-dynamic'`.
- **Thiếu biến môi trường phải vỡ ồn ào:** giống cách `src/lib/site.ts` đang làm với `NEXT_PUBLIC_SITE_URL` — throw kèm thông báo tiếng Việt nói rõ phải làm gì.
- **i18n:** mọi chuỗi giao diện của site nằm trong `messages/vi.json`. Nhãn trong admin Payload là ngoại lệ — chúng khai trong cấu hình collection.
- **Animation, motion token, ScrollTrigger, transition:** mọi ràng buộc của GĐ1 vẫn áp dụng. Giai đoạn này gần như không đụng tới chúng.
- Test output phải sạch.
- **Commit sau mỗi task.** Message tiếng Việt, prefix `feat:` / `fix:` / `chore:` / `test:`.

---

## File Structure

```
src/
  payload.config.ts            Cấu hình Payload: db, storage, collections, admin
  payload-types.ts             Type tự sinh — KHÔNG sửa tay
  collections/
    Users.ts                   Tài khoản nhân viên
    Media.ts                   Ảnh + hook sinh biến thể và blurDataURL
    Tours.ts                   Khớp tourSchema
  globals/
    Home.ts                    Khớp homeContentSchema
  lib/
    media/
      variants.ts              Logic sharp tách khỏi script cũ, dùng lại trong hook
      loader.ts                GIỮ — chỉ đổi quy ước tên biến thể
    content/
      schema.ts                KHÔNG ĐỔI
      guards.ts                KHÔNG ĐỔI
      index.ts                 Đổi 4 dòng re-export
      cms.ts                   MỚI — Local API + ánh xạ + validate zod
      map.ts                   MỚI — hàm ánh xạ THUẦN, có test, không phụ thuộc Payload
      fs.ts                    XOÁ ở Task 10
  app/
    (payload)/admin/[[...segments]]/page.tsx    Route admin do Payload sinh
    (payload)/api/[...slug]/route.ts            API route do Payload sinh
scripts/
  seed-payload.ts              Chuyển nội dung JSON hiện có vào Payload
```

**Vì sao tách `map.ts` khỏi `cms.ts`:** ánh xạ là phần dễ sai nhất và cũng dễ test nhất — nó chỉ là biến đổi dữ liệu. Tách ra thành hàm thuần cho phép test toàn bộ bằng dữ liệu mẫu, không cần database, không cần Payload. `cms.ts` chỉ còn phần gọi Local API và ghép zod vào, mỏng và ít chỗ để sai.

**Vì sao tách `variants.ts`:** logic sinh biến thể ảnh trong `scripts/build-media.ts` hiện tại là code tốt và đã qua review. Nó bị xoá ở Task 10 với tư cách *script*, nhưng *logic* phải sống tiếp trong hook của Payload. Tách ra trước, rồi mới xoá script.

---

### Task 1: Cài Payload, vào được `/admin`

Kết thúc task: mở `localhost:3000/admin`, tạo tài khoản đầu tiên, đăng nhập được. Chưa có collection nội dung nào.

**Files:**
- Create: `src/payload.config.ts`, `src/collections/Users.ts`, các route admin/api do Payload sinh
- Modify: `next.config.ts`, `package.json`, `.env.example`, `.gitignore`
- Test: không có test tự động cho task này (xem ghi chú cuối)

**Interfaces:**
- Consumes: không
- Produces: `src/payload.config.ts` export default cấu hình Payload; `payload-types.ts` tự sinh; alias `@payload-config` trỏ tới config

- [ ] **Step 1: Cài Payload và các adapter**

```bash
pnpm add payload @payloadcms/next @payloadcms/db-mongodb @payloadcms/storage-vercel-blob @payloadcms/richtext-lexical
```

`sharp` đã có sẵn trong devDependencies từ GĐ1 — Payload cần nó ở dependencies để xử lý ảnh lúc chạy. Chuyển sang dependencies:

```bash
pnpm add sharp
```

**Đối chiếu tài liệu:** tên chính xác của các package adapter và phiên bản tương thích với Next.js 15. Nếu Payload yêu cầu thêm package nào, cài và ghi lại trong report.

- [ ] **Step 2: Tạo biến môi trường**

Thêm vào `.env.example`:

```
# Payload CMS (GĐ2)
DATABASE_URI=
PAYLOAD_SECRET=
BLOB_READ_WRITE_TOKEN=
```

Tạo `.env.local` cho phát triển (đã nằm trong `.gitignore` từ GĐ1 — xác nhận lại). `DATABASE_URI` lấy từ MongoDB Atlas M0, `PAYLOAD_SECRET` là chuỗi ngẫu nhiên dài, `BLOB_READ_WRITE_TOKEN` lấy từ Vercel Blob.

**Nếu bạn không có sẵn tài khoản Atlas hoặc Blob:** dừng và báo BLOCKED. Đừng dựng MongoDB cục bộ để đi tiếp — nó sẽ giấu đi đúng những lỗi cấu hình mà task này sinh ra để phát hiện.

- [ ] **Step 3: Viết cấu hình Payload**

Tạo `src/payload.config.ts`. Yêu cầu bắt buộc, không phải cú pháp:

- Dùng adapter MongoDB, đọc chuỗi kết nối từ `DATABASE_URI`
- Dùng plugin Vercel Blob cho storage
- `secret` đọc từ `PAYLOAD_SECRET`
- Khai `Users` là collection auth
- Bật tự sinh types ra `src/payload-types.ts`
- Đặt admin ở đường dẫn `/admin`

**Thiếu biến môi trường phải vỡ ồn ào.** Thêm vào đầu file, theo đúng khuôn mẫu `src/lib/site.ts` đã dùng ở GĐ1:

```ts
function required(name: string, huongDan: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} chưa được đặt. ${huongDan}\n` +
        'Đặt trong .env.local khi phát triển, và trong Vercel Project Settings → Environment Variables trước khi deploy.',
    )
  }
  return value
}

const DATABASE_URI = required(
  'DATABASE_URI',
  'Đây là chuỗi kết nối MongoDB Atlas — lấy ở Atlas → Connect → Drivers.',
)
const PAYLOAD_SECRET = required(
  'PAYLOAD_SECRET',
  'Chuỗi ngẫu nhiên dài dùng để ký phiên đăng nhập admin. Sinh bằng: openssl rand -base64 32',
)
```

Không làm thế này thì build vỡ với thông báo của driver Mongo, thứ không nói cho ai biết phải làm gì.

- [ ] **Step 4: Viết collection Users**

Tạo `src/collections/Users.ts`. Yêu cầu:

- `auth: true`
- Trường hiển thị trong danh sách: email
- Nhãn tiếng Việt: số ít "Người dùng", số nhiều "Người dùng"
- Không thêm trường vai trò — spec mục 8 nói rõ giai đoạn này mọi người sửa được mọi thứ, và phân quyền cho ba người cùng công ty là phức tạp thừa

- [ ] **Step 5: Nối Payload vào Next.js**

Theo tài liệu Payload v3 cho Next.js App Router: thêm plugin vào `next.config.ts` (bọc config hiện có — **giữ nguyên** khối `images` với `loader: 'custom'`, `loaderFile` và `deviceSizes`), và tạo các route mà Payload yêu cầu dưới `src/app/(payload)/`.

**Cảnh báo:** `next.config.ts` hiện đang bọc bởi `withNextIntl`. Bọc thêm plugin của Payload phải giữ cả hai. Nếu thứ tự bọc gây lỗi, thử đổi thứ tự và ghi lại thứ tự nào chạy được — đây là loại chi tiết mà người sau sẽ vấp lại.

- [ ] **Step 6: Xác minh**

```bash
pnpm build
```

Rồi khởi động và kiểm bằng tay (KHÔNG chạy `pnpm dev` ở nền rồi bỏ đó — chạy, kiểm, tắt):

- `/admin` hiện màn hình tạo tài khoản đầu tiên
- Tạo được tài khoản, đăng nhập được
- `/vi` vẫn chạy như cũ, không hỏng gì
- `pnpm test` vẫn xanh

Ghi vào report: phiên bản Payload đã cài, thứ tự bọc plugin trong `next.config.ts` chạy được, và bất kỳ chỗ nào tài liệu khác với plan này.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: cài Payload CMS, vào được /admin

Cấu hình MongoDB Atlas + Vercel Blob, collection Users có auth. Biến môi
trường thiếu thì throw kèm hướng dẫn tiếng Việt, theo khuôn mẫu src/lib/site.ts
của GĐ1 — vỡ ồn ào rẻ hơn vỡ khó hiểu.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**Ghi chú về test:** task này không có test tự động. Nó là cấu hình hạ tầng, và một test kiểu "Payload khởi động được" chỉ lặp lại điều mà `pnpm build` đã nói. Đừng viết test chỉ để có test.

---

### Task 2: Collection Media — sinh biến thể và ảnh mờ lúc upload

Đây là task giữ lại giá trị lớn nhất của GĐ1: pipeline ảnh chuyển từ script chạy tay sang hook chạy tự động, và tính chất "chi phí biến đổi ảnh bằng không" được bảo toàn.

**Files:**
- Create: `src/lib/media/variants.ts`, `src/collections/Media.ts`
- Test: `src/lib/media/__tests__/variants.test.ts`

**Interfaces:**
- Consumes: `sharp`
- Produces:
  - `@/lib/media/variants` → `MEDIA_WIDTHS` (giữ nguyên `[640, 1024, 1600, 2400]` từ GĐ1), `generateBlurDataURL(buffer: Buffer): Promise<string>`, `OG_SIZE = { width: 1200, height: 630 }`
  - Collection `media` trong Payload, mỗi bản ghi có `blurDataURL`, `alt`, và các biến thể kích thước

- [ ] **Step 1: Viết test cho hàm sinh ảnh mờ**

Tạo `src/lib/media/__tests__/variants.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { generateBlurDataURL, MEDIA_WIDTHS, OG_SIZE } from '../variants'

async function anhMau(width = 100, height = 60): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 26, b: 33 } },
  })
    .jpeg()
    .toBuffer()
}

describe('generateBlurDataURL', () => {
  it('trả về data URL hợp lệ mà next/image chấp nhận', async () => {
    const result = await generateBlurDataURL(await anhMau())
    expect(result.startsWith('data:image/')).toBe(true)
    expect(result).toContain('base64,')
  })

  it('sinh ra chuỗi đủ ngắn để nhúng vào HTML mà không phình trang', async () => {
    const result = await generateBlurDataURL(await anhMau(2400, 1350))
    // Ảnh mờ phải nhỏ hơn 2KB — nó được nhúng thẳng vào HTML của mọi trang
    // dùng ảnh đó, nên phình lên là phạt trực tiếp vào thời gian tải.
    expect(result.length).toBeLessThan(2048)
  })

  it('cùng một ảnh cho ra cùng một chuỗi', async () => {
    const anh = await anhMau()
    expect(await generateBlurDataURL(anh)).toBe(await generateBlurDataURL(anh))
  })
})

describe('hằng số', () => {
  it('giữ nguyên bốn mốc bề rộng của GĐ1', () => {
    // Loader ảnh và cấu hình deviceSizes trong next.config.ts đều dựa vào
    // đúng bốn con số này. Lệch một chỗ là srcset sinh ra URL không tồn tại.
    expect(MEDIA_WIDTHS).toEqual([640, 1024, 1600, 2400])
  })

  it('ảnh chia sẻ mạng xã hội đúng 1200x630', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/media`
Expected: FAIL — `Cannot find module '../variants'`

- [ ] **Step 3: Viết `variants.ts`**

Tạo `src/lib/media/variants.ts`. Lấy logic từ `scripts/build-media.ts` hiện có — đừng viết lại từ đầu, code đó đã qua review và sửa một lỗi thật (sinh thiếu mốc kích thước làm ảnh 404 ở breakpoint lớn).

```ts
import sharp from 'sharp'

/**
 * Bốn mốc bề rộng dùng chung cho toàn dự án.
 *
 * PHẢI khớp `deviceSizes` trong `next.config.ts` và quy ước trong
 * `src/lib/media/loader.ts`. Lệch một chỗ là srcset trỏ tới file không tồn tại.
 */
export const MEDIA_WIDTHS = [640, 1024, 1600, 2400] as const

/**
 * Ảnh chia sẻ mạng xã hội. JPEG, không hậu tố kích thước — URL này KHÔNG đi qua
 * next/image nên loader không chạy, và Zalo lẫn Facebook đều không đọc được AVIF.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const

/**
 * Ảnh mờ giữ chỗ, nhúng thẳng vào HTML dưới dạng data URL.
 *
 * Cố ý giữ ở 16px: chuỗi này xuất hiện trong HTML của mọi trang dùng ảnh đó,
 * nên mỗi byte thừa là phạt trực tiếp vào thời gian tải trang.
 */
export async function generateBlurDataURL(input: Buffer): Promise<string> {
  const buffer = await sharp(input).resize(16).webp({ quality: 40 }).toBuffer()
  return `data:image/webp;base64,${buffer.toString('base64')}`
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test src/lib/media`
Expected: PASS — 5 test mới, cộng các test loader hiện có vẫn xanh

- [ ] **Step 5: Viết collection Media**

Tạo `src/collections/Media.ts`. Yêu cầu bắt buộc, cú pháp đối chiếu tài liệu Payload:

- `upload` bật, lưu qua plugin Vercel Blob
- Cấu hình `imageSizes` sinh đủ **bốn** mốc trong `MEDIA_WIDTHS`, định dạng AVIF; thêm một size tên `og` đúng `OG_SIZE`, định dạng **JPEG**, `fit: 'cover'`
- Trường `alt` kiểu group với trường con `vi` bắt buộc — khớp `localizedTextSchema`. Nhãn admin: "Mô tả ảnh (cho người khiếm thị và SEO)"
- Trường `blurDataURL` kiểu text, **ẩn khỏi giao diện admin**, điền tự động bằng hook
- Hook `beforeChange` (hoặc hook tương đương mà tài liệu chỉ định cho upload): đọc buffer ảnh gốc, gọi `generateBlurDataURL`, gán vào `blurDataURL`
- **Cảnh báo ảnh gốc quá nhỏ** (spec mục 6): nếu bề rộng ảnh gốc dưới 2400px, ghi cảnh báo cho người nhập thấy — dùng cơ chế mà Payload cung cấp cho việc này (trường ảo chỉ đọc, hoặc thông báo validate không chặn lưu). Nội dung: `Ảnh chỉ rộng <N>px, nhỏ hơn mốc lớn nhất 2400px. Ảnh vẫn dùng được nhưng sẽ mờ trên màn hình lớn.` **Không chặn lưu** — đôi khi chỉ có ảnh đó, và chặn sẽ khiến người nhập bế tắc. Mục đích là cho họ biết để tìm ảnh tốt hơn nếu có.

**Cảnh báo về `MEDIA_WIDTHS`:** GĐ1 đã gặp và sửa đúng lỗi này — script cũ bỏ qua mốc lớn hơn ảnh gốc, trong khi loader luôn giả định đủ bốn mốc, khiến ảnh 404 ở breakpoint lớn. **Sinh đủ bốn mốc kể cả khi ảnh gốc nhỏ hơn**, dùng tuỳ chọn không phóng to của Payload/sharp. Nếu Payload không cho phép, viết hook tự sinh và ghi rõ trong report.

- [ ] **Step 6: Kiểm bằng tay**

Khởi động, vào `/admin`, upload một ảnh JPEG rộng ít nhất 2400px. Xác nhận:

- Bốn biến thể AVIF được sinh và truy cập được qua URL Blob
- Biến thể `og` là JPEG, đúng 1200×630
- `blurDataURL` có giá trị dạng `data:image/webp;base64,...`
- Upload một ảnh nhỏ (ví dụ 800px) và xác nhận **vẫn đủ bốn biến thể**, không thiếu mốc nào

Dán kết quả kiểm này vào report — đặc biệt trường hợp ảnh nhỏ, vì đó là lỗi GĐ1 đã mắc.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: collection Media sinh biến thể ảnh và ảnh mờ lúc upload

Logic sharp tách từ scripts/build-media.ts sang src/lib/media/variants.ts để
hook của Payload dùng lại — pipeline ảnh của GĐ1 chuyển từ chạy tay sang tự
động, giữ nguyên tính chất chi phí biến đổi ảnh trên Vercel bằng không.

Sinh đủ bốn mốc kể cả với ảnh gốc nhỏ: đây đúng là lỗi GĐ1 đã mắc và sửa,
loader luôn giả định đủ bốn mốc nên thiếu một mốc là ảnh 404.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Collection Tours

**Files:**
- Create: `src/collections/Tours.ts`
- Test: không có test tự động (mô hình dữ liệu; đúng/sai của nó lộ ra ở Task 5 khi ánh xạ qua zod)

**Interfaces:**
- Consumes: collection `media` (Task 2)
- Produces: collection `tours` trong Payload; type `Tour` trong `payload-types.ts` (tự sinh)

- [ ] **Step 1: Đọc lại schema zod trước khi khai trường**

Mở `src/lib/content/schema.ts` và đọc `tourSchema`. Mô hình Payload phải cung cấp đủ dữ liệu để dựng đúng hình dạng đó. Đây là hợp đồng giữa hai file mà **không có gì tự động giữ chúng khớp** — Task 5 sẽ bắt lệch bằng zod, nhưng bắt càng sớm càng rẻ.

- [ ] **Step 2: Khai collection**

Tạo `src/collections/Tours.ts`. Các trường và ràng buộc:

| Trường Payload | Kiểu | Ràng buộc | Nhãn admin tiếng Việt |
|---|---|---|---|
| `slug` | text | bắt buộc, unique, chỉ chữ thường/số/gạch ngang | Đường dẫn (chữ thường, không dấu) |
| `title` | group `{ vi: text }` | `vi` bắt buộc | Tên tour |
| `tagline` | group `{ vi: text }` | `vi` bắt buộc | Câu giới thiệu ngắn |
| `summary` | group `{ vi: textarea }` | `vi` bắt buộc | Mô tả tổng quan |
| `durationDays` | number | bắt buộc, nguyên, > 0 | Số ngày |
| `priceFrom` | number | bắt buộc, > 0 | Giá từ (VND) |
| `destinations` | array of group `{ vi: text }` | tối thiểu 1 | Điểm đến |
| `heroMedia` | relationship → `media` | bắt buộc | Ảnh bìa |
| `gallery` | relationship → `media`, hasMany | tối thiểu 1 | Bộ ảnh |
| `itinerary` | array | số phần tử phải bằng `durationDays` | Lịch trình từng ngày |
| `itinerary[].title` | group `{ vi: text }` | bắt buộc | Tiêu đề ngày |
| `itinerary[].description` | group `{ vi: textarea }` | bắt buộc | Mô tả ngày |
| `itinerary[].media` | relationship → `media` | không bắt buộc | Ảnh của ngày |
| `inclusions` | array of group `{ vi: text }` | tối thiểu 1 | Bao gồm |
| `exclusions` | array of group `{ vi: text }` | cho phép rỗng | Không bao gồm |
| `notes` | group `{ vi: textarea }` | không bắt buộc | Ghi chú |
| `seo.title` | group `{ vi: text }` | bắt buộc | Tiêu đề SEO |
| `seo.description` | group `{ vi: textarea }` | bắt buộc | Mô tả SEO |
| `seo.ogImage` | relationship → `media` | bắt buộc | Ảnh chia sẻ mạng xã hội |

**Không khai `currency`.** `tourSchema` bắt buộc nó là hằng `'VND'`; bắt người nhập chọn một giá trị chỉ có một lựa chọn là phiền vô ích. Task 5 sẽ gán cứng `'VND'` khi ánh xạ.

**`itinerary` phải khớp `durationDays`.** Thêm validate ở cấp collection với thông báo tiếng Việt: "Số ngày trong lịch trình (X) không khớp Số ngày (Y)". Đây là ràng buộc mà `tourSchema` đã có; bắt nó ngay trong admin thì người nhập sửa được ngay, còn để tới zod thì họ chỉ thấy build vỡ.

- [ ] **Step 3: Kiểm bằng tay**

Vào `/admin`, tạo thử một tour có đủ mọi trường. Xác nhận:

- Không trường nào bắt buộc mà thiếu chỗ nhập
- Chọn ảnh từ thư viện media hoạt động
- Nhập `durationDays` = 3 nhưng chỉ thêm 2 ngày lịch trình thì **bị chặn kèm thông báo tiếng Việt**
- Nhãn hiển thị đúng tiếng Việt, không còn nhãn mặc định tiếng Anh nào

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: collection Tours khớp tourSchema

Không khai currency vì tourSchema bắt buộc hằng VND — bắt người nhập chọn một
giá trị duy nhất là phiền vô ích. Validate số ngày lịch trình khớp durationDays
ngay trong admin để người nhập sửa được tại chỗ thay vì thấy build vỡ.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Global Home

**Files:**
- Create: `src/globals/Home.ts`
- Modify: `src/payload.config.ts` (đăng ký global)

**Interfaces:**
- Consumes: collection `media` (Task 2), collection `tours` (Task 3)
- Produces: global `home` trong Payload

- [ ] **Step 1: Khai global**

Tạo `src/globals/Home.ts`, khớp `homeContentSchema` trong `src/lib/content/schema.ts`:

| Trường | Kiểu | Nhãn admin |
|---|---|---|
| `hero.headline` | group `{ vi: text }` | Tiêu đề lớn trang chủ |
| `hero.subline` | group `{ vi: textarea }` | Câu phụ dưới tiêu đề |
| `hero.media` | relationship → `media` | Ảnh nền trang chủ |
| `whyUs` | array of `{ title: {vi}, body: {vi} }`, tối thiểu 1 | Vì sao chọn chúng tôi |
| `featuredTours` | relationship → `tours`, hasMany, tối thiểu 1 | Tour nổi bật |
| `journey.headline` | group `{ vi: text }` | Tiêu đề mục Hành trình |
| `journey.stops` | array of `{ label: {vi}, image: rel→media }`, **tối thiểu 2** | Các điểm đến |
| `testimonials` | array of `{ name, quote: {vi}, tour?: rel→tours, avatar?: rel→media }` | Cảm nhận khách hàng |
| `contact.phone` | text, bắt buộc | Số điện thoại |
| `contact.zaloUrl` | text, bắt buộc, dạng URL | Link Zalo |
| `contact.email` | email, bắt buộc | Email nhận yêu cầu |

**`featuredTours` là quan hệ thật, không phải mảng chuỗi slug.** Người nhập chọn tour từ danh sách. Điều này loại bỏ hẳn lỗi trỏ tới tour không tồn tại — GĐ1 phải viết một test riêng để bắt nó. Schema zod **không đổi**: nó vẫn khai `featuredTourSlugs` là mảng chuỗi, và Task 5 chuyển quan hệ thành slug.

**`journey.stops` tối thiểu 2 là ràng buộc thật, không phải tuỳ ý.** `JourneyCinematic` tính quãng cuộn ngang từ tổng bề rộng các điểm đến; dưới 2 điểm thì quãng cuộn bằng 0 và section pin sẽ khoá màn hình mà không có gì di chuyển. GĐ1 đã thêm `Math.max(0, ...)` để chặn, nhưng chặn ở đây thì người nhập biết ngay.

- [ ] **Step 2: Kiểm bằng tay**

Vào `/admin` → Home. Nhập đủ nội dung. Xác nhận chọn tour nổi bật từ danh sách hoạt động, và thêm chỉ 1 điểm đến vào Hành trình thì bị chặn.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: global Home khớp homeContentSchema

featuredTours là quan hệ thật thay vì mảng slug — loại bỏ hẳn lỗi trỏ tới tour
không tồn tại mà GĐ1 phải viết test riêng để bắt. Schema zod không đổi; Task 5
lo việc chuyển quan hệ thành slug.

journey.stops tối thiểu 2 vì dưới đó quãng cuộn ngang bằng 0 và section pin sẽ
khoá màn hình mà không có gì di chuyển.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Hàm ánh xạ Payload → hình dạng nội bộ

Đây là task quan trọng nhất của giai đoạn. Ánh xạ là phần dễ sai nhất và cũng dễ test nhất — nó chỉ là biến đổi dữ liệu, không phụ thuộc database, không phụ thuộc Payload.

**Files:**
- Create: `src/lib/content/map.ts`
- Test: `src/lib/content/__tests__/map.test.ts`

**Interfaces:**
- Consumes: types từ `@/lib/content` (`Tour`, `HomeContent`, `ImageAsset`, `LocalizedText`)
- Produces:
  - `@/lib/content/map` → `mapMedia(doc: unknown): ImageAsset`, `mapTour(doc: unknown): unknown`, `mapHome(doc: unknown, tourSlugById: Map<string, string>): unknown`
  - Ba hàm trả `unknown` **có chủ đích**: chúng dựng hình dạng, còn việc khẳng định hình dạng đó đúng là việc của zod ở Task 6. Trả về type đã khẳng định sẽ vô hiệu hoá chính lớp bảo vệ đó.

- [ ] **Step 1: Viết test**

Tạo `src/lib/content/__tests__/map.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mapMedia, mapTour, mapHome } from '../map'
import { imageAssetSchema, tourSchema, homeContentSchema } from '../schema'

const mediaDoc = {
  id: 'm1',
  url: 'https://blob.example.com/anh-w2400.avif',
  width: 2400,
  height: 1350,
  alt: { vi: 'Đèo Mã Pí Lèng nhìn từ trên cao' },
  blurDataURL: 'data:image/webp;base64,UklGRg==',
}

describe('mapMedia', () => {
  it('dựng ImageAsset mà schema chấp nhận', () => {
    expect(() => imageAssetSchema.parse(mapMedia(mediaDoc))).not.toThrow()
  })

  it('giữ nguyên alt bọc locale, không làm phẳng thành chuỗi', () => {
    const result = imageAssetSchema.parse(mapMedia(mediaDoc))
    expect(result.alt).toEqual({ vi: 'Đèo Mã Pí Lèng nhìn từ trên cao' })
  })

  it('ném lỗi nói rõ id khi thiếu blurDataURL', () => {
    // Hook ở Task 2 điền trường này. Nếu nó vắng mặt thì hook hỏng, và thông báo
    // phải chỉ đúng bản ghi để người sửa tìm được nó trong admin.
    const { blurDataURL, ...thieu } = mediaDoc
    expect(() => mapMedia(thieu)).toThrow(/m1/)
  })

  it('ném lỗi khi quan hệ chưa được nạp (chỉ còn id dạng chuỗi)', () => {
    // Payload trả về id thay vì document khi depth không đủ. Đây là lỗi truy vấn,
    // không phải lỗi dữ liệu, và thông báo phải nói đúng điều đó.
    expect(() => mapMedia('m1')).toThrow(/chưa được nạp|depth/i)
  })
})

const tourDoc = {
  id: 't1',
  slug: 'mau-ha-giang',
  title: { vi: 'Hà Giang mùa hoa tam giác mạch' },
  tagline: { vi: 'Bốn ngày trên cung đường đá' },
  summary: { vi: 'Hành trình qua bốn huyện vùng cao.' },
  durationDays: 2,
  priceFrom: 6900000,
  destinations: [{ vi: 'Quản Bạ' }, { vi: 'Đồng Văn' }],
  heroMedia: mediaDoc,
  gallery: [mediaDoc],
  itinerary: [
    { title: { vi: 'Ngày một' }, description: { vi: 'Khởi hành sớm.' } },
    { title: { vi: 'Ngày hai' }, description: { vi: 'Về xuôi.' }, media: mediaDoc },
  ],
  inclusions: [{ vi: 'Xe đưa đón' }],
  exclusions: [{ vi: 'Chi phí cá nhân' }],
  seo: {
    title: { vi: 'Tour Hà Giang' },
    description: { vi: 'Cung đường đá Hà Giang.' },
    ogImage: mediaDoc,
  },
}

describe('mapTour', () => {
  it('dựng Tour mà schema chấp nhận', () => {
    expect(() => tourSchema.parse(mapTour(tourDoc))).not.toThrow()
  })

  it('gán cứng currency VND vì người nhập không được hỏi về nó', () => {
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.currency).toBe('VND')
  })

  it('đánh số ngày lịch trình từ 1 theo thứ tự mảng', () => {
    // Payload không lưu số ngày; thứ tự trong mảng LÀ số ngày. Người nhập kéo
    // thả để sắp lại, và số phải đi theo thứ tự mới chứ không dính vào bản ghi.
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.itinerary.map((d) => d.day)).toEqual([1, 2])
  })

  it('bỏ trường media của ngày khi không có ảnh', () => {
    const result = tourSchema.parse(mapTour(tourDoc))
    expect(result.itinerary[0].media).toBeUndefined()
    expect(result.itinerary[1].media).toBeDefined()
  })

  it('để zod bắt khi số ngày lịch trình không khớp durationDays', () => {
    const sai = { ...tourDoc, durationDays: 5 }
    expect(() => tourSchema.parse(mapTour(sai))).toThrow()
  })
})

describe('mapHome', () => {
  const slugById = new Map([['t1', 'mau-ha-giang']])
  const homeDoc = {
    hero: { headline: { vi: 'Những cung đường' }, subline: { vi: 'Nhóm nhỏ.' }, media: mediaDoc },
    whyUs: [{ title: { vi: 'Nhóm nhỏ' }, body: { vi: 'Tối đa 12 khách.' } }],
    featuredTours: [{ id: 't1' }],
    journey: {
      headline: { vi: 'Hành trình đi qua' },
      stops: [
        { label: { vi: 'Quản Bạ' }, image: mediaDoc },
        { label: { vi: 'Đồng Văn' }, image: mediaDoc },
      ],
    },
    testimonials: [],
    contact: { phone: '0900000000', zaloUrl: 'https://zalo.me/0900000000', email: 'a@b.com' },
  }

  it('dựng HomeContent mà schema chấp nhận', () => {
    expect(() => homeContentSchema.parse(mapHome(homeDoc, slugById))).not.toThrow()
  })

  it('chuyển quan hệ tour thành mảng slug', () => {
    // Payload lưu quan hệ để người nhập chọn từ danh sách; schema nội bộ dùng
    // slug. Chuyển đổi này là lý do tầng adapter tồn tại.
    const result = homeContentSchema.parse(mapHome(homeDoc, slugById))
    expect(result.featuredTourSlugs).toEqual(['mau-ha-giang'])
  })

  it('ném lỗi nói rõ id khi quan hệ trỏ tới tour không còn tồn tại', () => {
    const mo côi = { ...homeDoc, featuredTours: [{ id: 'khong-ton-tai' }] }
    expect(() => mapHome(mo côi, slugById)).toThrow(/khong-ton-tai/)
  })
})
```

**Lưu ý:** đổi tên biến `mo côi` thành `moCoi` khi viết thật — dấu cách trong tên biến là lỗi cú pháp. Plan để vậy để bạn chú ý; đừng chép máy móc.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/content`
Expected: FAIL — `Cannot find module '../map'`

- [ ] **Step 3: Viết `map.ts`**

Tạo `src/lib/content/map.ts`. Nguyên tắc dẫn đường: **mọi lỗi phải chỉ đúng bản ghi gây ra nó.** Người sửa lỗi sẽ đứng trong giao diện admin với hàng chục bản ghi; một thông báo kiểu "Expected object, received undefined" không giúp họ tìm ra cái nào sai.

```ts
import type { ImageAsset } from './schema'

/** Ném lỗi kèm ngữ cảnh đủ để tìm ra bản ghi trong admin. */
function loi(thongDiep: string, id?: unknown): never {
  throw new Error(id ? `${thongDiep} (bản ghi: ${String(id)})` : thongDiep)
}

/**
 * Payload trả về id dạng chuỗi thay vì document khi truy vấn không đủ `depth`.
 * Phân biệt hai trường hợp này quan trọng: một cái là lỗi truy vấn của lập
 * trình viên, cái kia là lỗi dữ liệu của người nhập, và cách sửa khác hẳn nhau.
 */
function phaiLaDocument(value: unknown, ten: string): Record<string, unknown> {
  if (typeof value === 'string' || typeof value === 'number') {
    loi(`Quan hệ "${ten}" chưa được nạp — tăng depth khi truy vấn Payload`, value)
  }
  if (!value || typeof value !== 'object') {
    loi(`Quan hệ "${ten}" rỗng hoặc sai kiểu`)
  }
  return value as Record<string, unknown>
}

export function mapMedia(doc: unknown): ImageAsset {
  const m = phaiLaDocument(doc, 'media')
  if (!m.blurDataURL) {
    loi('Ảnh thiếu blurDataURL — hook sinh ảnh mờ không chạy, thử tải lại ảnh', m.id)
  }
  return {
    src: String(m.url ?? loi('Ảnh không có url', m.id)),
    alt: m.alt as ImageAsset['alt'],
    width: Number(m.width),
    height: Number(m.height),
    blurDataURL: String(m.blurDataURL),
  }
}

export function mapTour(doc: unknown): unknown {
  const t = phaiLaDocument(doc, 'tour')
  const itinerary = (t.itinerary as unknown[] | undefined) ?? []

  return {
    slug: t.slug,
    title: t.title,
    tagline: t.tagline,
    summary: t.summary,
    durationDays: t.durationDays,
    priceFrom: t.priceFrom,
    // Người nhập không được hỏi về đơn vị tiền — schema bắt buộc hằng VND.
    currency: 'VND',
    destinations: t.destinations,
    heroMedia: mapMedia(t.heroMedia),
    gallery: ((t.gallery as unknown[] | undefined) ?? []).map(mapMedia),
    itinerary: itinerary.map((ngay, index) => {
      const d = ngay as Record<string, unknown>
      return {
        // Thứ tự trong mảng LÀ số ngày. Người nhập kéo thả để sắp lại, và số
        // phải đi theo thứ tự mới chứ không dính cứng vào bản ghi.
        day: index + 1,
        title: d.title,
        description: d.description,
        ...(d.media ? { media: mapMedia(d.media) } : {}),
      }
    }),
    inclusions: t.inclusions,
    exclusions: (t.exclusions as unknown[] | undefined) ?? [],
    ...(t.notes ? { notes: t.notes } : {}),
    seo: {
      title: (t.seo as Record<string, unknown>)?.title,
      description: (t.seo as Record<string, unknown>)?.description,
      ogImage: mapMedia((t.seo as Record<string, unknown>)?.ogImage),
    },
  }
}

export function mapHome(doc: unknown, tourSlugById: Map<string, string>): unknown {
  const h = phaiLaDocument(doc, 'home')
  const hero = h.hero as Record<string, unknown>
  const journey = h.journey as Record<string, unknown>

  return {
    hero: {
      headline: hero?.headline,
      subline: hero?.subline,
      media: mapMedia(hero?.media),
    },
    whyUs: h.whyUs,
    featuredTourSlugs: ((h.featuredTours as unknown[] | undefined) ?? []).map((ref) => {
      const id = typeof ref === 'object' && ref !== null ? (ref as { id: unknown }).id : ref
      const slug = tourSlugById.get(String(id))
      if (!slug) {
        loi('Tour nổi bật trỏ tới một tour không còn tồn tại — bỏ nó khỏi trang chủ', id)
      }
      return slug
    }),
    journey: {
      headline: journey?.headline,
      stops: ((journey?.stops as unknown[] | undefined) ?? []).map((s) => {
        const stop = s as Record<string, unknown>
        return { label: stop.label, image: mapMedia(stop.image) }
      }),
    },
    testimonials: ((h.testimonials as unknown[] | undefined) ?? []).map((x) => {
      const t = x as Record<string, unknown>
      return {
        name: t.name,
        quote: t.quote,
        ...(t.tour ? { tourSlug: tourSlugById.get(String((t.tour as { id: unknown }).id)) } : {}),
        ...(t.avatar ? { avatar: mapMedia(t.avatar) } : {}),
      }
    }),
    contact: h.contact,
  }
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test src/lib/content`
Expected: PASS toàn bộ test trong `map.test.ts`

Nếu một test fail vì hình dạng thật của document Payload khác với dữ liệu mẫu, **sửa dữ liệu mẫu cho khớp thực tế rồi sửa hàm ánh xạ** — đừng nới lỏng test. Ghi lại chỗ khác biệt trong report; nó có nghĩa là mô hình ở Task 3/4 cần điều chỉnh.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: hàm ánh xạ Payload sang hình dạng nội bộ

Tách thành hàm thuần để test toàn bộ bằng dữ liệu mẫu, không cần database.
Mọi lỗi đều kèm id bản ghi — người sửa đứng trong admin với hàng chục bản ghi,
thông báo không chỉ đúng cái nào sai thì vô dụng.

Phân biệt 'quan hệ chưa nạp' với 'dữ liệu sai': cái đầu là lỗi depth của truy
vấn, cái sau là lỗi người nhập, cách sửa khác hẳn nhau.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `cms.ts` và nối vào interface

Kết thúc task: site chạy hoàn toàn bằng dữ liệu từ Payload, `fs.ts` bị xoá, và **không component nào bị sửa**.

**Files:**
- Create: `src/lib/content/cms.ts`
- Modify: `src/lib/content/index.ts` (đúng 4 dòng)
- Delete: `src/lib/content/fs.ts`, `src/lib/content/__tests__/fs.test.ts`

**Interfaces:**
- Consumes: `mapMedia`/`mapTour`/`mapHome` (Task 5), Payload Local API (Task 1)
- Produces: `readTours()`, `readTour(slug)`, `readTourSlugs()`, `readHomeContent()` — **cùng chữ ký với `fs.ts` cũ**, để `index.ts` chỉ đổi đường dẫn import

- [ ] **Step 1: Viết `cms.ts`**

Tạo `src/lib/content/cms.ts`. Yêu cầu, cú pháp Local API đối chiếu tài liệu Payload:

```ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { cache } from 'react'
import { homeContentSchema, tourSchema, type HomeContent, type Tour } from './schema'
import { mapHome, mapTour } from './map'

/**
 * Cache theo từng request: layout.tsx và page.tsx đều gọi getHomeContent().
 * Không có cache thì mỗi trang truy vấn database hai lần cho cùng một dữ liệu.
 */
const getClient = cache(async () => getPayload({ config }))

function parseOrThrow<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } }, data: unknown, nguon: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Dữ liệu từ CMS không hợp lệ tại ${nguon}.\n` +
        'Mô hình trong Payload và schema zod đã lệch nhau — sửa bản ghi trong /admin hoặc sửa hàm ánh xạ.\n' +
        JSON.stringify(result.error, null, 2),
    )
  }
  return result.data as T
}

/** depth 2 để nạp cả ảnh nằm trong lịch trình và trong seo. */
const DEPTH = 2

export const readTours = cache(async (): Promise<Tour[]> => {
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'tours', depth: DEPTH, limit: 1000 })
  return docs.map((doc) => parseOrThrow<Tour>(tourSchema, mapTour(doc), `tour "${doc.slug}"`))
})

export const readTour = cache(async (slug: string): Promise<Tour | null> => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'tours',
    where: { slug: { equals: slug } },
    depth: DEPTH,
    limit: 1,
  })
  if (docs.length === 0) return null
  return parseOrThrow<Tour>(tourSchema, mapTour(docs[0]), `tour "${slug}"`)
})

export const readTourSlugs = cache(async (): Promise<string[]> => {
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'tours', depth: 0, limit: 1000, select: { slug: true } })
  return docs.map((d) => String(d.slug))
})

export const readHomeContent = cache(async (): Promise<HomeContent> => {
  const payload = await getClient()
  const [home, tours] = await Promise.all([
    payload.findGlobal({ slug: 'home', depth: DEPTH }),
    payload.find({ collection: 'tours', depth: 0, limit: 1000, select: { slug: true } }),
  ])
  const slugById = new Map(tours.docs.map((d) => [String(d.id), String(d.slug)]))
  return parseOrThrow<HomeContent>(homeContentSchema, mapHome(home, slugById), 'nội dung trang chủ')
})
```

**Đối chiếu tài liệu:** chữ ký `payload.find`, `payload.findGlobal`, tuỳ chọn `select`, và alias `@payload-config`. Nếu `select` không tồn tại ở phiên bản đã cài, bỏ nó — nó chỉ là tối ưu, không phải yêu cầu.

**`cache()` của React không phải tuỳ chọn.** GĐ1 gọi `getHomeContent()` ở cả `layout.tsx` lẫn `page.tsx`. Với file thì đó là hai lần đọc đĩa, không đáng kể. Với database thì là hai truy vấn mạng cho mỗi trang. Đây chính là chỗ rò rỉ mà review cuối GĐ1 đã cảnh báo.

- [ ] **Step 2: Đổi `index.ts`**

Trong `src/lib/content/index.ts`, đổi **duy nhất** dòng import:

```ts
import { readHomeContent, readTour, readTours, readTourSlugs } from './cms'
```

Cập nhật comment đầu file cho khớp thực tế: nó đang nói "GĐ2 sẽ viết cms.ts" — giờ điều đó đã xong, comment phải mô tả hiện tại chứ không phải dự định.

**Không đổi gì khác trong file này.** Bốn hàm export giữ nguyên tên, chữ ký, và thứ tự.

- [ ] **Step 3: Xoá `fs.ts` và test của nó**

```bash
git rm src/lib/content/fs.ts src/lib/content/__tests__/fs.test.ts
```

`fs.test.ts` kiểm tra hành vi hệ thống file ("slug khớp file trong thư mục") — không còn đối tượng. Giá trị của nó đã chuyển sang `map.test.ts`.

Bộ test `og-image.test.ts` cũng đọc file và sẽ hỏng. Xoá luôn — ràng buộc nó bảo vệ (ảnh OG không mang hậu tố kích thước và phải tồn tại) giờ do collection `media` bảo đảm ở tầng cấu hình: size `og` là JPEG không hậu tố, và quan hệ bắt buộc nên không thể trỏ tới file không tồn tại.

- [ ] **Step 4: Xác minh ràng buộc trung tâm của cả giai đoạn**

```bash
git diff --stat src/components
```

**Phải rỗng.** Nếu có bất kỳ file nào hiện ra, ranh giới content layer đã rò rỉ. Dừng lại, tìm xem component nào đang phụ thuộc vào chi tiết của tầng lưu trữ, và sửa ở `map.ts` hoặc `cms.ts` — **không sửa component**.

- [ ] **Step 5: Chạy và kiểm bằng tay**

```bash
pnpm test
pnpm build
```

Build cần dữ liệu thật trong Payload. Nếu database rỗng, `generateStaticParams` trả mảng rỗng và không có trang tour nào được sinh — đó là hành vi đúng, không phải lỗi. Task 9 sẽ nạp dữ liệu.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: đọc nội dung từ Payload thay vì file, xoá fs.ts

index.ts đổi đúng một dòng import — ranh giới content layer mà cả GĐ1 xây dựng
để chuẩn bị đã hoạt động đúng như thiết kế. git diff --stat src/components rỗng.

Bọc mọi hàm đọc bằng cache() của React: GĐ1 gọi getHomeContent() ở cả layout
lẫn page, với file là hai lần đọc đĩa, với database là hai truy vấn mạng mỗi
trang.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Loader ảnh theo quy ước mới

**Files:**
- Modify: `src/lib/media/loader.ts`, `src/lib/media/__tests__/loader.test.ts`

**Interfaces:**
- Consumes: quy ước đặt tên biến thể **quan sát được ở Task 2**
- Produces: `mediaLoader({ src, width })` — cùng chữ ký, hành vi mới

- [ ] **Step 1: Xác định quy ước thật**

Mở report của Task 2 và lấy ra URL thật của các biến thể đã upload. **Đừng đoán.** Payload kết hợp với Vercel Blob sinh URL theo quy ước riêng, và có thể kèm hậu tố ngẫu nhiên chống trùng tên.

Ghi lại vào report của task này bốn URL thật của cùng một ảnh ở bốn mốc, đặt cạnh nhau, để thấy rõ phần nào thay đổi.

Nếu quy ước **không** cho phép suy ra URL của mốc này từ mốc khác bằng biến đổi chuỗi thuần, thì loader không thể là hàm thuần nữa. Trong trường hợp đó: dừng, báo lại, và ta sẽ đổi thiết kế — cho `map.ts` mang theo cả bốn URL trong `ImageAsset` và bỏ hẳn custom loader. Đây là một khả năng thật, không phải giả định phòng xa.

- [ ] **Step 2: Cập nhật test trước**

Trong `src/lib/media/__tests__/loader.test.ts`, thay các URL mẫu bằng quy ước thật vừa quan sát. **Giữ nguyên ba trường hợp bẫy mà bộ test đang bảo vệ**, chúng vẫn nguyên giá trị:

- URL tuyệt đối của một dịch vụ khác đi thẳng, không bị biến đổi
- Một URL đã mang mốc kích thước không bị thêm mốc lần thứ hai
- Bề rộng yêu cầu lớn hơn mọi mốc thì rơi về mốc lớn nhất

Thêm một trường hợp mới: bề rộng nằm giữa hai mốc phải chọn mốc lớn hơn, không phải mốc gần hơn. Chọn nhỏ hơn sẽ làm ảnh bị kéo giãn.

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/media`
Expected: FAIL ở các trường hợp dùng quy ước mới

- [ ] **Step 4: Sửa loader**

Giữ nguyên chữ ký và giữ nguyên hai lối thoát sớm hiện có (URL của dịch vụ khác đi thẳng; URL đã có mốc thì giữ nguyên). Chỉ đổi phần dựng URL biến thể.

- [ ] **Step 5: Chạy test và kiểm bằng mắt**

Run: `pnpm test src/lib/media` — PASS.

Rồi build và mở trang tour, xem `srcset` của một thẻ ảnh trong DevTools: bốn URL phải đều tồn tại (mở thử một cái). GĐ1 đã có lỗi đúng kiểu này — srcset trỏ tới file chưa từng được sinh — và nó chỉ lộ ra ở màn hình lớn.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: loader ảnh theo quy ước tên biến thể của Payload

Quy ước lấy từ URL thật quan sát được sau khi upload, không đoán. Giữ nguyên
ba trường hợp bẫy mà bộ test cũ bảo vệ.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Đăng là thấy ngay

**Files:**
- Modify: `src/collections/Tours.ts`, `src/globals/Home.ts`

**Interfaces:**
- Consumes: collections từ Task 3, 4
- Produces: hook `afterChange` gọi `revalidatePath`

- [ ] **Step 1: Thêm hook vào Tours**

Hook `afterChange` trên `tours` phải làm mới:

- `/vi/tour/<slug>` — trang tour vừa sửa
- `/vi` — trang chủ, vì tour có thể đang nằm trong danh sách nổi bật
- `/sitemap.xml` — nếu tour mới được tạo hoặc slug đổi

**Phải xử lý cả trường hợp đổi slug.** Payload cung cấp document trước và sau thay đổi; nếu slug đổi, làm mới **cả đường dẫn cũ lẫn mới**. Bỏ sót đường dẫn cũ sẽ để lại một trang tĩnh mồ côi trỏ tới nội dung không còn tồn tại.

Hook cũng phải chạy khi **xoá** tour (`afterDelete`), nếu không trang tour đã xoá vẫn còn trên site.

- [ ] **Step 2: Thêm hook vào Home**

`afterChange` trên global `home` làm mới `/vi`.

- [ ] **Step 3: Kiểm bằng tay — đây là tiêu chí thành công số 1 của cả giai đoạn**

Chạy bản production (`pnpm build && pnpm start`, nhớ tắt sau):

1. Mở `/vi` trong một tab, ghi nhớ tiêu đề hero
2. Vào `/admin` → Home, sửa tiêu đề hero, lưu
3. Tải lại `/vi` — tiêu đề mới phải hiện trong vòng vài giây, **không cần build lại**
4. Đổi slug của một tour, xác nhận đường dẫn cũ không còn trả về trang cũ
5. Xoá một tour, xác nhận trang của nó biến mất

Dán kết quả từng bước vào report. Đây là thứ spec định nghĩa là thành công; một mô tả chung chung "revalidation hoạt động" không đủ.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: sửa nội dung trong admin là thấy ngay trên site

Hook afterChange gọi revalidatePath trong cùng tiến trình — Payload chạy chung
với Next.js nên không cần webhook. Xử lý cả đổi slug và xoá: bỏ sót đường dẫn
cũ sẽ để lại trang tĩnh mồ côi.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Nạp nội dung hiện có vào Payload

**Files:**
- Create: `scripts/seed-payload.ts`
- Modify: `package.json` (thêm lệnh `seed`)

**Interfaces:**
- Consumes: `content/home.json`, `content/tours/*.json`, Payload Local API
- Produces: lệnh `pnpm seed`

- [ ] **Step 1: Viết script**

Tạo `scripts/seed-payload.ts`. Nó đọc các file JSON hiện có và tạo bản ghi trong Payload.

Giá trị thật của script này **không phải là di trú dữ liệu** — nội dung hiện tại gần như toàn là mẫu. Giá trị của nó là **kiểm chứng đầu-cuối rằng mô hình Payload nhận đúng hình dạng mà zod chấp nhận**. Nó là một phép thử, viết dưới dạng script.

Yêu cầu:

- Upload ảnh từ `public/media/placeholder/` vào collection `media` trước, giữ lại id
- Tạo tour, trỏ quan hệ ảnh tới id vừa có
- Tạo global `home`, trỏ `featuredTours` tới id tour vừa tạo
- **Không chạy được hai lần mà nhân đôi dữ liệu:** kiểm tra slug đã tồn tại thì bỏ qua và in ra thông báo, đừng tạo trùng
- In rõ từng bước và dừng ngay ở lỗi đầu tiên, kèm tên bản ghi đang xử lý

- [ ] **Step 2: Chạy và kiểm**

```bash
pnpm seed
```

Rồi vào `/admin` xác nhận tour và nội dung trang chủ hiện đúng, ảnh xem được. Chạy `pnpm seed` lần thứ hai và xác nhận nó **không** tạo bản ghi trùng.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: script nạp nội dung JSON hiện có vào Payload

Giá trị thật không phải di trú dữ liệu — nội dung hiện tại gần như toàn là mẫu
— mà là kiểm chứng đầu-cuối rằng mô hình Payload nhận đúng hình dạng zod chấp
nhận. Chạy lại nhiều lần không tạo bản ghi trùng.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Dọn dẹp

**Files:**
- Delete: `scripts/build-media.ts`, `scripts/build-placeholders.ts`, `content/home.json`, `content/tours/*.json`, `content/media-manifest.json` (nếu có)
- Modify: `package.json`, `README.md`, `.gitignore`

- [ ] **Step 1: Xoá script và nội dung JSON**

```bash
git rm scripts/build-media.ts scripts/build-placeholders.ts
git rm -r content/
```

**Giữ `src/lib/media/variants.ts`** — logic sharp đã chuyển vào đó ở Task 2 và đang được hook dùng.

- [ ] **Step 2: Dọn `package.json`**

Xoá `media` và `placeholders`. Giữ `seed`. `video` vẫn là lệnh báo lỗi có kiểm soát từ GĐ1 — giữ nguyên, pipeline video vẫn hoãn.

- [ ] **Step 3: Dọn `.gitignore` và `next.config.ts`**

`/public/media` và `/assets-src` không còn ý nghĩa — ảnh giờ ở Vercel Blob. Xoá hai dòng đó khỏi `.gitignore`, và xoá thư mục `public/media/` lẫn `assets-src/` khỏi máy.

Trong `next.config.ts`, kiểm `deviceSizes` vẫn khớp `MEDIA_WIDTHS`. Nếu Task 7 đổi quy ước làm lệch, sửa cho khớp.

- [ ] **Step 4: Viết lại README**

Các mục về ảnh trong README hiện mô tả một quy trình không còn tồn tại — `pnpm placeholders`, đặt ảnh vào `assets-src/`, copy metadata sang JSON. Thay bằng quy trình thật: vào `/admin`, upload ảnh, biến thể sinh tự động.

Thêm ba biến môi trường mới vào bảng, và vào mục Deploy như điều kiện bắt buộc trước lần deploy đầu — cùng chỗ với `NEXT_PUBLIC_SITE_URL`.

Xoá mục hướng dẫn `assets-src/DOC-DAT-ANH-VAO-DAU.md` nếu README có trỏ tới.

- [ ] **Step 5: Xác minh không còn tham chiếu mồ côi**

```bash
grep -rn "build-media\|build-placeholders\|assets-src\|content/tours\|media-manifest" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" . | grep -v node_modules | grep -v docs/superpowers
```

Kết quả phải rỗng (trừ tài liệu spec/plan, vốn ghi lại lịch sử).

```bash
pnpm test && pnpm build && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: dọn pipeline ảnh chạy tay và nội dung JSON

Ảnh giờ vào qua /admin và biến thể sinh tự động lúc upload, nên assets-src,
public/media và hai script chạy tay đều không còn ý nghĩa. Giữ variants.ts —
logic sharp vẫn sống trong hook của Payload.

README viết lại: quy trình đưa ảnh vào đã đổi hoàn toàn.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Nghiệm thu

Task này không thêm tính năng. Nó chứng minh GĐ2 không phá vỡ những gì GĐ1 đã đạt.

**Files:**
- Modify: `docs/nghiem-thu-hieu-nang.md`

- [ ] **Step 1: Kiểm ràng buộc trung tâm lần cuối**

```bash
git diff --stat <commit trước Task 1>..HEAD -- src/components
```

**Phải rỗng.** Đây là tiêu chí số 2 trong spec và là lời hứa mà toàn bộ kiến trúc GĐ1 được xây để giữ. Nếu không rỗng, liệt kê từng file và giải thích trong report vì sao — rồi hỏi trước khi đi tiếp.

- [ ] **Step 2: Đo lại hiệu năng**

Đúng cách GĐ1 đã đo, để số liệu so sánh được:

```bash
pnpm build
pnpm start -p 3100   # nhớ tắt sau bằng PowerShell theo cổng
npx -y lighthouse@latest http://localhost:3100/vi \
  --output=json --output-path=.superpowers/perf/lh-gd2-mobile.json \
  --only-categories=performance,accessibility --form-factor=mobile --screenEmulation.mobile \
  --throttling-method=simulate --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
```

Đọc JSON bằng `PYTHONIOENCODING=utf-8 python -c "..."` — console Windows không in được tiếng Việt từ Python nếu thiếu biến này.

Đo cả desktop bằng `--preset=desktop`.

Ngưỡng phải giữ: Performance ≥ 90 mobile, LCP < 2.5s, CLS < 0.1, bundle trang chủ < 200 KB. Accessibility đang ở 98 — không được tụt.

**Bundle sẽ tăng** vì Payload có mặt trong dự án. Ghi con số thật. Nếu vượt 200 KB, kiểm xem code của admin có lọt vào bundle của khách không — nó phải được tách riêng.

- [ ] **Step 3: Kiểm build vỡ đúng cách**

Tạm bỏ `DATABASE_URI` khỏi `.env.local` rồi chạy `pnpm build`. Phải vỡ kèm thông báo tiếng Việt nói rõ phải làm gì, **không** phải lỗi driver Mongo khó hiểu. Khôi phục biến sau khi kiểm.

- [ ] **Step 4: Ghi kết quả**

Thêm một mục vào `docs/nghiem-thu-hieu-nang.md`: số đo GĐ2 đặt cạnh số đo GĐ1, ngày đo, và giải thích mọi chênh lệch. Nếu một chỉ số tụt, nói rõ tụt bao nhiêu và vì sao — đừng làm tròn cho đẹp.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: nghiệm thu GĐ2 — số đo đặt cạnh GĐ1

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Kiểm tra sau khi hoàn thành GĐ2

- [ ] `git diff --stat src/components` rỗng so với trước Task 1
- [ ] Một người chưa từng thấy dự án tạo được một tour hoàn chỉnh qua `/admin` và thấy nó trên site trong vài giây
- [ ] Mọi ngưỡng hiệu năng GĐ1 vẫn đạt, có số đo ghi lại
- [ ] `pnpm test` xanh, output sạch
- [ ] Thiếu biến môi trường database thì build vỡ kèm thông báo tiếng Việt
- [ ] Không còn tham chiếu tới `assets-src`, `content/`, `build-media`, `build-placeholders`
- [ ] Nội dung mẫu đã thay bằng nội dung thật: số điện thoại, Zalo, email, ảnh tour
