# Landing Page Tour Du Lịch — GĐ1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng website bán tour du lịch tiếng Việt với trải nghiệm cinematic scroll-telling, nội dung đọc từ content layer có schema, deploy trên Vercel.

**Architecture:** Next.js 15 App Router static-generated. Nội dung tour nằm trong file JSON, được validate bằng zod và chỉ truy cập qua một interface duy nhất (`src/lib/content/index.ts`) để GĐ2 thay bằng CMS mà không đụng UI. Animation chia hai lớp: Motion cho reveal/hover/transition (chiếm đa số), GSAP ScrollTrigger cho 3 "cinematic beat" cần pin và scrub. Mọi hiệu ứng đi qua một hệ thống 3 tầng degradation quyết định tại runtime.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, next-intl, motion, gsap + ScrollTrigger, lenis, zod, sharp, ffmpeg (CLI), Resend, Vitest, Vercel.

**Spec nguồn:** [`docs/superpowers/specs/2026-09-06-travel-landing-page-design.md`](../specs/2026-09-06-travel-landing-page-design.md)

## Global Constraints

Mọi task đều ngầm bao gồm các ràng buộc dưới đây.

- **Package manager:** `pnpm`. Không dùng npm/yarn trong dự án này.
- **Content layer:** dữ liệu chỉ đi qua `src/lib/content/index.ts`. Không component nào đọc file, biết đường dẫn, hay biết định dạng lưu trữ.
  - Server Component: import hàm và type từ `@/lib/content` như bình thường.
  - Client Component (`'use client'`): chỉ được `import type` từ `@/lib/content` — type bị xoá lúc biên dịch nên không kéo gì vào bundle. **Giá trị runtime như `isVideoAsset` phải lấy từ `@/lib/content/guards`.** Import một giá trị runtime từ barrel vào client sẽ kéo `fs.ts` và `node:fs/promises` vào bundle trình duyệt và làm vỡ build.
- **Animation:** chỉ animate `transform` và `opacity`. Cấm animate `width`, `height`, `top`, `left`, `margin`, `filter` trong vòng lặp scroll.
- **Motion token:** mọi duration/easing/stagger lấy từ `src/lib/motion/tokens.ts`. Không hard-code giá trị timing trong component.
- **Degradation:** mọi animation phải đọc tier từ `useMotionTier()`. Tier `reduced` chỉ fade; tier `lite` không pin, không scrub video.
- **Vòng đời ScrollTrigger:** component nào tạo trigger thì component đó kill trong cleanup của chính nó. Cấm `ScrollTrigger.getAll().forEach(t => t.kill())` — thứ tự cleanup giữa parent và child không đảm bảo, kill toàn cục sẽ xoá cả trigger mà component khác vừa tạo lại khi tier đổi.
- **Import động phải bắt lỗi:** mọi `import()` GSAP/Lenis đi kèm `.catch` ghi log tiếng Việt. Chunk tải hỏng (mạng chập chờn, ad-blocker) không được biến thành unhandled promise rejection.
- **i18n:** mọi chuỗi giao diện nằm trong `messages/vi.json`. Mọi trường nội dung hướng người đọc trong content JSON bọc theo locale `{ vi: "..." }`.
- **Rendering:** trang chủ và trang tour dùng static generation. Không dùng `dynamic = 'force-dynamic'`.
- **Ảnh:** hiển thị bằng `next/image` với custom loader. Không bật Vercel Image Optimization.
- **Video scrub:** ≤ 6 giây, ≤ 3 MB, encode `-g 1`.
- **Ngưỡng nghiệm thu:** LCP < 2.5s mobile, CLS < 0.1, INP < 200ms, ≥ 55fps khi scroll qua cinematic beat, Lighthouse mobile ≥ 90, bundle JS trang chủ gzip < 200 KB.
- **Tên thương hiệu: `RosaTravel`.** Viết liền, hai chữ hoa. Dùng ở tiêu đề trang, logo header, bản quyền footer, và template metadata. Lưu trong `messages/vi.json` dưới khoá `brand.name` để đổi ở một chỗ duy nhất.
- **Không bịa nội dung tour thật.** Dữ liệu mẫu phải đặt tên rõ là mẫu (`content/tours/mau-*.json`).
- **Commit sau mỗi task.** Message tiếng Việt, prefix `feat:` / `test:` / `chore:` / `fix:`.

## File Structure

```
assets-src/                          Ảnh & video gốc, KHÔNG deploy (gitignore)
  tours/<slug>/                      Ảnh gốc theo tour
  video/                             Video gốc
content/
  home.json                          Nội dung trang chủ
  tours/mau-ha-giang.json            Tour mẫu (thay bằng tour thật sau)
messages/vi.json                     Chuỗi giao diện tiếng Việt
public/media/                        Ảnh & video đã sinh (build output, gitignore)
scripts/
  build-media.ts                     sharp: sinh AVIF/WebP nhiều size + blur placeholder
  build-video.ts                     ffmpeg: encode mp4/webm + bản scrub keyframe dày
src/
  app/
    [locale]/
      layout.tsx                     Shell: providers, header, footer
      page.tsx                       Trang chủ
      tour/[slug]/page.tsx           Trang chi tiết tour
      lien-he/page.tsx               Trang liên hệ
    api/contact/route.ts             Route Handler gửi email
    globals.css                      Tailwind v4 + @theme tokens
    sitemap.ts / robots.ts           SEO
  components/
    layout/Header.tsx, Footer.tsx, PageTransition.tsx
    home/HeroCinematic.tsx           Cinematic beat #1
    home/WhyUs.tsx, TourGrid.tsx, Testimonials.tsx, FinalCta.tsx
    home/JourneyCinematic.tsx        Cinematic beat #2
    tour/TourHero.tsx, ItineraryCinematic.tsx (beat #3), Gallery.tsx, InclusionList.tsx
    contact/ContactForm.tsx
    media/Media.tsx                  Wrapper next/image + video, dùng chung
    motion/Reveal.tsx                Component reveal dùng chung
  lib/
    content/schema.ts                zod schema — nguồn chân lý về hình dạng dữ liệu
    content/guards.ts                type guard thuần, 0 phụ thuộc runtime — client dùng được
    content/fs.ts                    Implementation đọc file (chỉ chạy ở server)
    content/index.ts                 INTERFACE công khai — chỗ Server Component import
    motion/tokens.ts                 Duration, easing, stagger, distance
    motion/tier.ts                   resolveMotionTier() — hàm thuần, có test
    motion/MotionTierProvider.tsx    Context + hook useMotionTier()
    motion/SmoothScroll.tsx          Cầu nối Lenis ↔ ScrollTrigger
    media/loader.ts                  Custom next/image loader — hàm thuần, có test
  i18n/routing.ts, request.ts        Cấu hình next-intl
```

Nguyên tắc chia file: mỗi cinematic beat là một file riêng vì mỗi cái có logic ScrollTrigger phức tạp và độc lập. Logic thuần (`tier.ts`, `loader.ts`, `schema.ts`) tách khỏi React để test được bằng Vitest không cần DOM.

`guards.ts` tồn tại vì `isVideoAsset` là **giá trị runtime**, không phải type. Nếu nó chỉ nằm trong barrel `index.ts`, một client component import nó sẽ kéo theo `fs.ts` và `node:fs/promises` vào bundle trình duyệt và làm vỡ build. File này chỉ `import type` từ `schema.ts` nên sau khi biên dịch không còn phụ thuộc gì:

```ts
import type { MediaAsset, VideoAsset } from './schema'

/** Phân biệt ảnh với video ở phía component mà không cần ép kiểu. */
export function isVideoAsset(media: MediaAsset): media is VideoAsset {
  return 'kind' in media && media.kind === 'video'
}
```

`index.ts` re-export lại `isVideoAsset` từ đây, để Server Component vẫn chỉ cần biết một cửa duy nhất.

---

### Task 1: Scaffold dự án, design token, i18n

Task này dựng nền. Kết thúc task, `pnpm dev` mở được `/vi` hiển thị một trang trống có font và màu đúng, `pnpm test` chạy được, `pnpm build` pass.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Create: `src/app/globals.css`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`, `messages/vi.json`
- Create: `src/lib/motion/tokens.ts`
- Test: `src/lib/motion/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: (không có, task đầu tiên)
- Produces:
  - `@/lib/motion/tokens` → `duration: { fast: 150; base: 300; slow: 600; slower: 900 }`, `easing: { enter: string; scrub: string; hover: string }`, `stagger: 0.06`, `distance: 24`
  - `@/i18n/routing` → `routing` object của next-intl, `locales = ['vi']`, `defaultLocale = 'vi'`
  - Alias TypeScript `@/*` → `src/*`

- [ ] **Step 1: Tạo dự án Next.js**

```bash
cd /d/Rosa
pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-pnpm
```

Khi được hỏi ghi đè file có sẵn: giữ lại `docs/`. Nếu công cụ từ chối vì thư mục không rỗng, tạo ở thư mục tạm rồi copy sang, giữ nguyên `docs/` và `.git/`.

- [ ] **Step 2: Cài dependency**

```bash
pnpm add motion gsap lenis zod next-intl
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom sharp tsx
```

`sharp` để ở devDependencies vì chỉ chạy lúc build media, không chạy runtime.

- [ ] **Step 3: Cấu hình Vitest**

Tạo `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

Thêm vào `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
"media": "tsx scripts/build-media.ts",
"video": "tsx scripts/build-video.ts"
```

- [ ] **Step 4: Viết test cho motion token**

Tạo `src/lib/motion/__tests__/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { duration, easing, stagger, distance } from '../tokens'

describe('motion tokens', () => {
  it('cung cấp 4 mức duration tăng dần', () => {
    expect(duration.fast).toBeLessThan(duration.base)
    expect(duration.base).toBeLessThan(duration.slow)
    expect(duration.slow).toBeLessThan(duration.slower)
  })

  it('duration tính bằng giây để dùng trực tiếp với gsap và motion', () => {
    expect(duration.base).toBe(0.3)
  })

  it('cung cấp easing cho enter, scrub, hover', () => {
    expect(easing.enter).toBeDefined()
    expect(easing.scrub).toBeDefined()
    expect(easing.hover).toBeDefined()
  })

  it('stagger và distance có giá trị dùng được', () => {
    expect(stagger).toBe(0.06)
    expect(distance).toBe(24)
  })
})
```

- [ ] **Step 5: Chạy test để xác nhận nó fail**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '../tokens'`

- [ ] **Step 6: Viết motion token**

Tạo `src/lib/motion/tokens.ts`:

```ts
/**
 * Timing cho animation điều khiển bằng JS (gsap, motion). Đơn vị giây.
 *
 * Animation thuần CSS (hover, transition trong Tailwind) lấy từ các biến
 * `--duration-*` / `--ease-*` khai báo trong `src/app/globals.css`. Hai bản này
 * PHẢI khớp nhau; đổi một bên thì đổi cả hai. Tách làm hai vì Tailwind không
 * đọc được file TypeScript.
 */
export const duration = {
  fast: 0.15,
  base: 0.3,
  slow: 0.6,
  slower: 0.9,
} as const

/**
 * Chuỗi cubic-bezier dùng cho gsap (CustomEase không cần thiết ở đây).
 * enter: bung nhanh rồi hãm mượt — hợp với reveal khi vào viewport.
 * scrub: đối xứng — hợp với animation buộc vào tiến độ scroll.
 * hover: hãm nhẹ — phản hồi tức thì nhưng không cụt.
 */
export const easing = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  scrub: 'cubic-bezier(0.45, 0, 0.55, 1)',
  hover: 'cubic-bezier(0.33, 1, 0.68, 1)',
} as const

/** Dạng mảng cho motion (framer-motion nhận [x1, y1, x2, y2]). */
export const easingArray = {
  enter: [0.16, 1, 0.3, 1],
  scrub: [0.45, 0, 0.55, 1],
  hover: [0.33, 1, 0.68, 1],
} as const

/** Khoảng cách giữa các phần tử trong một nhóm reveal, đơn vị giây. */
export const stagger = 0.06

/** Quãng dịch chuyển của reveal, đơn vị px. */
export const distance = 24

/** Độ trễ làm mượt khi buộc animation vào tiến độ scroll — tham số `scrub` của ScrollTrigger. */
export const scrubSmoothing = 0.6

/** Thời gian nội suy khi gán currentTime cho video scrub, đơn vị giây. */
export const scrubTweenDuration = 0.2
```

- [ ] **Step 7: Chạy test để xác nhận pass**

Run: `pnpm test`
Expected: PASS, 4 test

- [ ] **Step 8: Cấu hình design token trong Tailwind v4**

Tailwind v4 không dùng `tailwind.config.js` — token khai báo bằng `@theme` ngay trong CSS.

Ghi đè `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Bảng màu: nền mực đậm cho cảm giác cinematic, kem ấm cho vùng nội dung,
     đất nung làm điểm nhấn CTA. Chỉnh ở đây là đổi toàn site. */
  --color-ink-950: #0b0f14;
  --color-ink-900: #141a21;
  --color-ink-700: #2b3541;
  --color-ink-500: #5c6a7a;
  --color-sand-100: #f7f3ec;
  --color-sand-200: #ece4d7;
  --color-sand-400: #c9b99e;
  --color-clay-500: #b4552f;
  --color-clay-600: #96421f;

  --font-display: "Playfair Display", Georgia, serif;
  --font-sans: "Be Vietnam Pro", system-ui, sans-serif;

  --spacing-section: 7rem;

  /* Timing cho animation thuần CSS (hover, transition). PHẢI khớp với
     src/lib/motion/tokens.ts — file đó là bản dùng cho JS/GSAP/Motion, còn đây
     là bản dùng cho Tailwind. Đổi một bên thì đổi cả hai. */
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 600ms;
  --duration-slower: 900ms;
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-hover: cubic-bezier(0.33, 1, 0.68, 1);
}

:root {
  color-scheme: dark;
}

html {
  /* Lenis điều khiển scroll; tắt smooth của trình duyệt để hai bên không đánh nhau. */
  scroll-behavior: auto;
}

body {
  background-color: var(--color-ink-950);
  color: var(--color-sand-100);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Hai font đều có bộ ký tự tiếng Việt đầy đủ trên Google Fonts. `Be Vietnam Pro` được thiết kế riêng cho dấu tiếng Việt — dấu không bị chạm vào chữ hoa như phần lớn font Latin.

- [ ] **Step 9: Cấu hình next-intl**

Tạo `src/i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // GĐ1 chỉ ship tiếng Việt. Thêm 'en' vào đây là bật được ngôn ngữ thứ hai.
  locales: ['vi'],
  defaultLocale: 'vi',
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]
```

Tạo `src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = routing.locales.includes(requested as never)
    ? (requested as string)
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```

Tạo `src/middleware.ts`:

```ts
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/', '/(vi|en)/:path*', '/((?!api|_next|_vercel|media|.*\\..*).*)'],
}
```

Cập nhật `next.config.ts`:

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Tắt tối ưu ảnh của Vercel: ảnh đã được sinh sẵn lúc build bằng sharp.
    // Xem scripts/build-media.ts và src/lib/media/loader.ts.
    loader: 'custom',
    loaderFile: './src/lib/media/loader.ts',
  },
}

export default withNextIntl(nextConfig)
```

- [ ] **Step 10: Tạo messages và layout**

Tạo `messages/vi.json`:

```json
{
  "nav": {
    "home": "Trang chủ",
    "tours": "Tour",
    "contact": "Liên hệ"
  },
  "cta": {
    "viewTour": "Xem chi tiết",
    "bookNow": "Liên hệ đặt tour",
    "callUs": "Gọi ngay",
    "zalo": "Nhắn Zalo",
    "finalHeadline": "Sẵn sàng lên đường?",
    "tourHeadline": "Quan tâm hành trình này?",
    "tourSub": "Để lại số điện thoại, chúng tôi gọi lại trong 24 giờ."
  },
  "tour": {
    "duration": "Thời lượng",
    "priceFrom": "Giá từ",
    "destinations": "Điểm đến",
    "itinerary": "Lịch trình",
    "gallery": "Hình ảnh",
    "inclusions": "Bao gồm",
    "exclusions": "Không bao gồm",
    "day": "Ngày {n}",
    "durationDays": "{n} ngày"
  },
  "contact": {
    "title": "Liên hệ đặt tour",
    "name": "Họ và tên",
    "phone": "Số điện thoại",
    "tour": "Tour quan tâm",
    "note": "Ghi chú",
    "submit": "Gửi yêu cầu",
    "sending": "Đang gửi...",
    "success": "Đã nhận yêu cầu. Chúng tôi sẽ liên hệ trong 24 giờ.",
    "error": "Gửi không thành công. Vui lòng gọi trực tiếp cho chúng tôi."
  },
  "errors": {
    "nameRequired": "Vui lòng nhập họ tên",
    "phoneInvalid": "Số điện thoại không hợp lệ"
  }
}
```

Tạo `src/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google'
import { routing } from '@/i18n/routing'
import '../globals.css'

const sans = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

const display = Playfair_Display({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '600'],
  variable: '--font-playfair',
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: 'Tour du lịch',
  description: 'Những hành trình được chọn lọc.',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as never)) notFound()

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${sans.variable} ${display.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
```

Tạo `src/app/[locale]/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="font-[family-name:var(--font-playfair)] text-5xl">
        Hành trình bắt đầu tại đây
      </h1>
    </main>
  )
}
```

Xoá `src/app/page.tsx` và `src/app/layout.tsx` do create-next-app sinh ra — layout gốc giờ nằm trong `[locale]/`.

- [ ] **Step 11: Cập nhật .gitignore**

Thêm vào cuối `.gitignore`:

```
# Ảnh và video gốc — nặng, không deploy
/assets-src

# Media sinh ra lúc build
/public/media
```

- [ ] **Step 12: Xác minh dự án chạy**

```bash
pnpm test
pnpm build
```

Expected: test PASS 4/4; build thành công, output có route `/[locale]` là static (ký hiệu `○`). Mở `pnpm dev` và truy cập `http://localhost:3000/vi` — thấy tiêu đề serif trên nền mực đậm. Truy cập `/` phải redirect sang `/vi`.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15, design token, i18n tiếng Việt

Dựng nền dự án: App Router + Tailwind v4 với @theme token, next-intl
routing /[locale] chỉ bật vi, motion token tập trung, Vitest.
next/image dùng custom loader để tắt image optimization của Vercel.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Content schema và adapter

Đây là task quan trọng nhất về mặt kiến trúc. Làm đúng thì GĐ2 (cắm CMS) chỉ tốn một ngày.

**Files:**
- Create: `src/lib/content/schema.ts`, `src/lib/content/fs.ts`, `src/lib/content/index.ts`
- Create: `content/home.json`, `content/tours/mau-ha-giang.json`
- Test: `src/lib/content/__tests__/schema.test.ts`, `src/lib/content/__tests__/fs.test.ts`

**Interfaces:**
- Consumes: (không phụ thuộc task khác)
- Produces:
  - `@/lib/content` → `getTours(): Promise<Tour[]>`, `getTour(slug: string): Promise<Tour | null>`, `getHomeContent(): Promise<HomeContent>`, `getTourSlugs(): Promise<string[]>`
  - Types: `Tour`, `HomeContent`, `ImageAsset`, `VideoAsset`, `MediaAsset`, `LocalizedText`, `ItineraryDay`

- [ ] **Step 1: Viết test cho schema**

Tạo `src/lib/content/__tests__/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { imageAssetSchema, videoAssetSchema, tourSchema } from '../schema'

const validImage = {
  src: '/media/tours/mau-ha-giang/deo-ma-pi-leng.avif',
  alt: { vi: 'Đèo Mã Pí Lèng nhìn từ trên cao' },
  width: 2400,
  height: 1600,
  blurDataURL: 'data:image/webp;base64,UklGRg==',
}

describe('imageAssetSchema', () => {
  it('chấp nhận ảnh có đủ trường', () => {
    expect(() => imageAssetSchema.parse(validImage)).not.toThrow()
  })

  it('chấp nhận URL tuyệt đối để sau này chuyển sang Blob/R2 không phải sửa code', () => {
    expect(() =>
      imageAssetSchema.parse({ ...validImage, src: 'https://cdn.example.com/a.avif' }),
    ).not.toThrow()
  })

  it('từ chối src không phải đường dẫn tuyệt đối hay URL', () => {
    expect(() => imageAssetSchema.parse({ ...validImage, src: 'a.avif' })).toThrow()
  })

  it('từ chối alt rỗng vì ảnh không có alt là lỗi accessibility', () => {
    expect(() => imageAssetSchema.parse({ ...validImage, alt: { vi: '' } })).toThrow()
  })

  it('từ chối blurDataURL không phải data URL', () => {
    expect(() => imageAssetSchema.parse({ ...validImage, blurDataURL: 'abc' })).toThrow()
  })
})

const validVideo = {
  kind: 'video' as const,
  mp4: '/media/video/hero.mp4',
  webm: '/media/video/hero.webm',
  poster: validImage,
  durationSec: 5,
  scrubbable: true,
}

describe('videoAssetSchema', () => {
  it('chấp nhận video scrub dài 5 giây', () => {
    expect(() => videoAssetSchema.parse(validVideo)).not.toThrow()
  })

  it('từ chối video scrub dài quá 6 giây vì keyframe dày làm file phồng', () => {
    expect(() => videoAssetSchema.parse({ ...validVideo, durationSec: 8 })).toThrow()
  })

  it('cho phép video không scrub dài hơn 6 giây', () => {
    expect(() =>
      videoAssetSchema.parse({ ...validVideo, scrubbable: false, durationSec: 20 }),
    ).not.toThrow()
  })
})

const validTour = {
  slug: 'mau-ha-giang',
  title: { vi: 'Hà Giang mùa hoa tam giác mạch' },
  tagline: { vi: 'Bốn ngày trên cung đường đá' },
  summary: { vi: 'Hành trình qua Quản Bạ, Yên Minh, Đồng Văn và Mèo Vạc.' },
  durationDays: 4,
  priceFrom: 6900000,
  currency: 'VND' as const,
  destinations: [{ vi: 'Quản Bạ' }, { vi: 'Yên Minh' }, { vi: 'Đồng Văn' }, { vi: 'Mèo Vạc' }],
  heroMedia: validImage,
  gallery: [validImage],
  // Số ngày phải khớp durationDays: 4 — schema có refine kiểm tra điều này,
  // nên fixture "hợp lệ" bắt buộc có đủ 4 ngày.
  itinerary: [
    { day: 1, title: { vi: 'Hà Nội – Quản Bạ' }, description: { vi: 'Khởi hành sớm.' } },
    { day: 2, title: { vi: 'Quản Bạ – Đồng Văn' }, description: { vi: 'Qua Yên Minh.' } },
    { day: 3, title: { vi: 'Đồng Văn – Mèo Vạc' }, description: { vi: 'Vượt Mã Pí Lèng.' } },
    { day: 4, title: { vi: 'Mèo Vạc – Hà Nội' }, description: { vi: 'Về xuôi.' } },
  ],
  inclusions: [{ vi: 'Xe đưa đón' }],
  exclusions: [{ vi: 'Chi phí cá nhân' }],
  seo: {
    title: { vi: 'Tour Hà Giang 4 ngày' },
    description: { vi: 'Cung đường đá Hà Giang qua bốn huyện vùng cao.' },
    ogImage: validImage,
  },
}

describe('tourSchema', () => {
  it('chấp nhận tour hợp lệ', () => {
    expect(() => tourSchema.parse(validTour)).not.toThrow()
  })

  it('từ chối slug có chữ hoa hoặc dấu để URL luôn sạch', () => {
    expect(() => tourSchema.parse({ ...validTour, slug: 'Hà-Giang' })).toThrow()
  })

  it('từ chối tour không có ngày nào trong lịch trình', () => {
    expect(() => tourSchema.parse({ ...validTour, itinerary: [] })).toThrow()
  })

  it('từ chối số ngày lịch trình không khớp durationDays', () => {
    expect(() => tourSchema.parse({ ...validTour, durationDays: 7 })).toThrow()
  })

  it('từ chối giá âm hoặc bằng không', () => {
    expect(() => tourSchema.parse({ ...validTour, priceFrom: 0 })).toThrow()
  })

  it('từ chối destinations dạng chuỗi thường — phải bọc locale để thêm tiếng Anh sau này', () => {
    expect(() => tourSchema.parse({ ...validTour, destinations: ['Quản Bạ'] })).toThrow()
  })

  it('từ chối seo.title dạng chuỗi thường — tiêu đề SEO cũng hướng người đọc', () => {
    expect(() =>
      tourSchema.parse({ ...validTour, seo: { ...validTour.seo, title: 'Tour Hà Giang' } }),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/content`
Expected: FAIL — `Cannot find module '../schema'`

- [ ] **Step 3: Viết schema**

Tạo `src/lib/content/schema.ts`:

```ts
import { z } from 'zod'

/**
 * Mọi văn bản hướng người đọc đều bọc theo locale ngay từ đầu.
 * Thêm tiếng Anh sau này là thêm khoá `en`, không phải migration.
 */
export const localizedTextSchema = z.object({
  vi: z.string().min(1, 'Nội dung tiếng Việt không được rỗng'),
  en: z.string().min(1).optional(),
})

/** Cho phép cả đường dẫn nội bộ (/media/...) lẫn URL tuyệt đối (Blob, R2). */
const mediaSrcSchema = z
  .string()
  .refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), {
    message: 'src phải là đường dẫn tuyệt đối bắt đầu bằng / hoặc URL http(s)',
  })

export const imageAssetSchema = z.object({
  src: mediaSrcSchema,
  alt: localizedTextSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataURL: z.string().startsWith('data:image/'),
})

export const videoAssetSchema = z
  .object({
    kind: z.literal('video'),
    mp4: mediaSrcSchema,
    webm: mediaSrcSchema,
    poster: imageAssetSchema,
    durationSec: z.number().positive(),
    scrubbable: z.boolean(),
  })
  .refine((v) => !v.scrubbable || v.durationSec <= 6, {
    message: 'Video scrub phải ngắn hơn hoặc bằng 6 giây (keyframe dày làm file phồng nhanh)',
    path: ['durationSec'],
  })

export const mediaAssetSchema = z.union([imageAssetSchema, videoAssetSchema])

export const itineraryDaySchema = z.object({
  day: z.number().int().positive(),
  title: localizedTextSchema,
  description: localizedTextSchema,
  media: imageAssetSchema.optional(),
})

export const tourSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug chỉ gồm chữ thường, số và dấu gạch ngang'),
    title: localizedTextSchema,
    tagline: localizedTextSchema,
    summary: localizedTextSchema,
    durationDays: z.number().int().positive(),
    priceFrom: z.number().positive(),
    currency: z.literal('VND'),
    // Tên điểm đến hiển thị cho người đọc nên cũng bọc locale: bản tiếng Anh
    // thường bỏ dấu ("Quan Ba") cho khách quốc tế dễ tra cứu.
    destinations: z.array(localizedTextSchema).min(1),
    heroMedia: mediaAssetSchema,
    gallery: z.array(imageAssetSchema).min(1),
    itinerary: z.array(itineraryDaySchema).min(1),
    inclusions: z.array(localizedTextSchema).min(1),
    exclusions: z.array(localizedTextSchema),
    notes: localizedTextSchema.optional(),
    // seo.title và seo.description hiện trên tab trình duyệt, kết quả tìm kiếm
    // và thẻ chia sẻ mạng xã hội — hướng người đọc, nên bọc locale như mọi
    // trường văn bản khác.
    seo: z.object({
      title: localizedTextSchema,
      description: localizedTextSchema,
      ogImage: imageAssetSchema,
    }),
  })
  .refine((t) => t.itinerary.length === t.durationDays, {
    message: 'Số ngày trong lịch trình phải khớp durationDays',
    path: ['itinerary'],
  })

export const testimonialSchema = z.object({
  name: z.string().min(1),
  quote: localizedTextSchema,
  tourSlug: z.string().optional(),
  avatar: imageAssetSchema.optional(),
})

export const homeContentSchema = z.object({
  hero: z.object({
    headline: localizedTextSchema,
    subline: localizedTextSchema,
    media: mediaAssetSchema,
  }),
  whyUs: z
    .array(z.object({ title: localizedTextSchema, body: localizedTextSchema }))
    .min(1),
  featuredTourSlugs: z.array(z.string()).min(1),
  journey: z.object({
    headline: localizedTextSchema,
    stops: z
      .array(z.object({ label: localizedTextSchema, image: imageAssetSchema }))
      .min(2),
  }),
  testimonials: z.array(testimonialSchema),
  contact: z.object({
    phone: z.string().min(1),
    zaloUrl: z.string().url(),
    email: z.string().email(),
  }),
})

export type LocalizedText = z.infer<typeof localizedTextSchema>
export type ImageAsset = z.infer<typeof imageAssetSchema>
export type VideoAsset = z.infer<typeof videoAssetSchema>
export type MediaAsset = z.infer<typeof mediaAssetSchema>
export type ItineraryDay = z.infer<typeof itineraryDaySchema>
export type Testimonial = z.infer<typeof testimonialSchema>
export type Tour = z.infer<typeof tourSchema>
export type HomeContent = z.infer<typeof homeContentSchema>

/** Phân biệt ảnh với video ở phía component mà không cần ép kiểu. */
export function isVideoAsset(media: MediaAsset): media is VideoAsset {
  return 'kind' in media && media.kind === 'video'
}
```

- [ ] **Step 4: Chạy test schema để xác nhận pass**

Run: `pnpm test src/lib/content`
Expected: PASS toàn bộ test trong `schema.test.ts`

- [ ] **Step 5: Viết test cho adapter**

Tạo `src/lib/content/__tests__/fs.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getTours, getTour, getTourSlugs, getHomeContent } from '../index'

describe('content adapter', () => {
  it('đọc được toàn bộ tour trong content/tours', async () => {
    const tours = await getTours()
    expect(tours.length).toBeGreaterThan(0)
  })

  it('mọi tour đọc ra đều đã qua validate schema', async () => {
    const tours = await getTours()
    for (const tour of tours) {
      expect(tour.itinerary.length).toBe(tour.durationDays)
      expect(tour.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('getTour trả về đúng tour theo slug', async () => {
    const slugs = await getTourSlugs()
    const tour = await getTour(slugs[0])
    expect(tour?.slug).toBe(slugs[0])
  })

  it('getTour trả về null khi slug không tồn tại thay vì ném lỗi', async () => {
    expect(await getTour('khong-ton-tai')).toBeNull()
  })

  it('getTourSlugs trả về slug khớp với file trong thư mục', async () => {
    const slugs = await getTourSlugs()
    const tours = await getTours()
    expect(slugs.sort()).toEqual(tours.map((t) => t.slug).sort())
  })

  it('getHomeContent trả về nội dung đã validate', async () => {
    const home = await getHomeContent()
    expect(home.featuredTourSlugs.length).toBeGreaterThan(0)
  })

  it('mọi slug trong featuredTourSlugs đều tồn tại thật', async () => {
    const home = await getHomeContent()
    const slugs = await getTourSlugs()
    for (const slug of home.featuredTourSlugs) {
      expect(slugs).toContain(slug)
    }
  })
})
```

Test cuối là loại test đáng giá nhất ở đây: nó bắt được lỗi trỏ tới tour không tồn tại — lỗi rất dễ xảy ra khi thêm/xoá tour, và nếu không bắt sớm thì sẽ nổ lúc build production.

- [ ] **Step 6: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/content`
Expected: FAIL — `Cannot find module '../index'`

- [ ] **Step 7: Viết dữ liệu mẫu**

Tạo `content/tours/mau-ha-giang.json`. Đây là **dữ liệu mẫu**, đường dẫn ảnh trỏ tới file sẽ được Task 4 sinh ra:

```json
{
  "slug": "mau-ha-giang",
  "title": { "vi": "Hà Giang mùa hoa tam giác mạch" },
  "tagline": { "vi": "Bốn ngày trên cung đường đá" },
  "summary": { "vi": "Hành trình qua Quản Bạ, Yên Minh, Đồng Văn và Mèo Vạc, đi đúng mùa hoa tam giác mạch nở trên các triền đá tai mèo." },
  "durationDays": 4,
  "priceFrom": 6900000,
  "currency": "VND",
  "destinations": [
    { "vi": "Quản Bạ" },
    { "vi": "Yên Minh" },
    { "vi": "Đồng Văn" },
    { "vi": "Mèo Vạc" }
  ],
  "heroMedia": {
    "src": "/media/placeholder/hero.avif",
    "alt": { "vi": "Ảnh mẫu chờ thay bằng ảnh tour thật" },
    "width": 2400,
    "height": 1350,
    "blurDataURL": "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="
  },
  "gallery": [
    {
      "src": "/media/placeholder/gallery-1.avif",
      "alt": { "vi": "Ảnh mẫu chờ thay bằng ảnh tour thật" },
      "width": 1600,
      "height": 1067,
      "blurDataURL": "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="
    }
  ],
  "itinerary": [
    { "day": 1, "title": { "vi": "Hà Nội – Quản Bạ" }, "description": { "vi": "Khởi hành sớm, dừng ở cổng trời Quản Bạ khi trời còn sương." } },
    { "day": 2, "title": { "vi": "Quản Bạ – Đồng Văn" }, "description": { "vi": "Qua Yên Minh, dốc Thẩm Mã, dinh thự họ Vương." } },
    { "day": 3, "title": { "vi": "Đồng Văn – Mèo Vạc" }, "description": { "vi": "Vượt đèo Mã Pí Lèng, xuống bến thuyền sông Nho Quế." } },
    { "day": 4, "title": { "vi": "Mèo Vạc – Hà Nội" }, "description": { "vi": "Ghé chợ phiên rồi về xuôi." } }
  ],
  "inclusions": [
    { "vi": "Xe đưa đón toàn tuyến" },
    { "vi": "Khách sạn 3 sao, phòng đôi" },
    { "vi": "Hướng dẫn viên bản địa" }
  ],
  "exclusions": [{ "vi": "Chi phí cá nhân" }, { "vi": "Đồ uống có cồn" }],
  "seo": {
    "title": { "vi": "Tour Hà Giang 4 ngày 3 đêm" },
    "description": { "vi": "Cung đường đá Hà Giang qua Quản Bạ, Yên Minh, Đồng Văn, Mèo Vạc." },
    "ogImage": {
      "src": "/media/placeholder/og.avif",
      "alt": { "vi": "Ảnh mẫu chờ thay bằng ảnh tour thật" },
      "width": 1200,
      "height": 630,
      "blurDataURL": "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="
    }
  }
}
```

Tạo `content/home.json`. Số điện thoại, Zalo và email dưới đây là **giá trị mẫu, phải thay bằng thông tin thật trước khi deploy**:

```json
{
  "hero": {
    "headline": { "vi": "Những cung đường đáng đi một lần" },
    "subline": { "vi": "Hành trình được thiết kế riêng, nhóm nhỏ, hướng dẫn viên bản địa." },
    "media": {
      "src": "/media/placeholder/hero.avif",
      "alt": { "vi": "Ảnh mẫu chờ thay bằng ảnh tour thật" },
      "width": 2400,
      "height": 1350,
      "blurDataURL": "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="
    }
  },
  "whyUs": [
    { "title": { "vi": "Nhóm nhỏ" }, "body": { "vi": "Tối đa 12 khách mỗi chuyến để không ai bị bỏ lại phía sau." } },
    { "title": { "vi": "Người bản địa dẫn đường" }, "body": { "vi": "Hướng dẫn viên sinh ra tại vùng đất bạn sắp đến." } },
    { "title": { "vi": "Lịch trình có khoảng thở" }, "body": { "vi": "Không nhồi điểm đến. Đủ thời gian để thật sự nhìn thấy nơi mình đang đứng." } }
  ],
  "featuredTourSlugs": ["mau-ha-giang"],
  "journey": {
    "headline": { "vi": "Hành trình đi qua" },
    "stops": [
      {
        "label": { "vi": "Quản Bạ" },
        "image": { "src": "/media/placeholder/gallery-1.avif", "alt": { "vi": "Ảnh mẫu chờ thay" }, "width": 1600, "height": 1067, "blurDataURL": "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==" }
      },
      {
        "label": { "vi": "Yên Minh" },
        "image": { "src": "/media/placeholder/gallery-1.avif", "alt": { "vi": "Ảnh mẫu chờ thay" }, "width": 1600, "height": 1067, "blurDataURL": "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==" }
      },
      {
        "label": { "vi": "Đồng Văn" },
        "image": { "src": "/media/placeholder/gallery-1.avif", "alt": { "vi": "Ảnh mẫu chờ thay" }, "width": 1600, "height": 1067, "blurDataURL": "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==" }
      },
      {
        "label": { "vi": "Mèo Vạc" },
        "image": { "src": "/media/placeholder/gallery-1.avif", "alt": { "vi": "Ảnh mẫu chờ thay" }, "width": 1600, "height": 1067, "blurDataURL": "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==" }
      }
    ]
  },
  "testimonials": [],
  "contact": {
    "phone": "0900000000",
    "zaloUrl": "https://zalo.me/0900000000",
    "email": "lienhe@example.com"
  }
}
```

- [ ] **Step 8: Viết adapter và interface**

Tạo `src/lib/content/fs.ts`:

```ts
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { homeContentSchema, tourSchema, type HomeContent, type Tour } from './schema'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const TOURS_DIR = path.join(CONTENT_DIR, 'tours')

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

/**
 * Validate và ném lỗi kèm tên file. Content sai ở file nào phải nói ra file đó,
 * không thì đi tìm giữa hàng chục tour rất mất thời gian.
 */
function parseOrThrow<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } },
  data: unknown,
  source: string,
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Nội dung không hợp lệ tại ${source}:\n${JSON.stringify(result.error, null, 2)}`)
  }
  return result.data as T
}

export async function readTourSlugs(): Promise<string[]> {
  const files = await readdir(TOURS_DIR)
  return files.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
}

export async function readTour(slug: string): Promise<Tour | null> {
  const file = path.join(TOURS_DIR, `${slug}.json`)
  try {
    return parseOrThrow<Tour>(tourSchema, await readJson(file), file)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function readTours(): Promise<Tour[]> {
  const slugs = await readTourSlugs()
  const tours = await Promise.all(slugs.map(readTour))
  return tours.filter((t): t is Tour => t !== null)
}

export async function readHomeContent(): Promise<HomeContent> {
  const file = path.join(CONTENT_DIR, 'home.json')
  return parseOrThrow<HomeContent>(homeContentSchema, await readJson(file), file)
}
```

Tạo `src/lib/content/index.ts`:

```ts
/**
 * INTERFACE CÔNG KHAI CỦA CONTENT LAYER.
 *
 * Đây là chỗ DUY NHẤT component được phép import nội dung. Không component nào
 * được import từ './fs' hay đọc file trực tiếp.
 *
 * GĐ2 (cắm CMS): viết './cms.ts' với cùng bốn hàm dưới đây, rồi đổi các dòng
 * re-export. Không một file nào trong src/components phải sửa.
 */
import { readHomeContent, readTour, readTours, readTourSlugs } from './fs'
import type { HomeContent, Tour } from './schema'

export async function getTours(): Promise<Tour[]> {
  return readTours()
}

export async function getTour(slug: string): Promise<Tour | null> {
  return readTour(slug)
}

export async function getTourSlugs(): Promise<string[]> {
  return readTourSlugs()
}

export async function getHomeContent(): Promise<HomeContent> {
  return readHomeContent()
}

export { isVideoAsset } from './schema'
export type {
  HomeContent,
  ImageAsset,
  ItineraryDay,
  LocalizedText,
  MediaAsset,
  Testimonial,
  Tour,
  VideoAsset,
} from './schema'
```

- [ ] **Step 9: Chạy test để xác nhận pass**

Run: `pnpm test src/lib/content`
Expected: PASS toàn bộ

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: content layer với zod schema và adapter đọc file

Schema là nguồn chân lý duy nhất về hình dạng dữ liệu tour. Component chỉ
được import từ src/lib/content/index.ts để GĐ2 thay bằng CMS không đụng UI.
Kèm tour mẫu và nội dung trang chủ mẫu (số điện thoại/email là giá trị
placeholder, cần thay bằng thông tin thật).

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Nền tảng animation — tier, Reveal, smooth scroll

**Files:**
- Create: `src/lib/motion/tier.ts`, `src/lib/motion/MotionTierProvider.tsx`, `src/lib/motion/SmoothScroll.tsx`
- Create: `src/components/motion/Reveal.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Test: `src/lib/motion/__tests__/tier.test.ts`

**Interfaces:**
- Consumes: `@/lib/motion/tokens` (Task 1)
- Produces:
  - `@/lib/motion/tier` → `type MotionTier = 'reduced' | 'lite' | 'full'`, `interface DeviceSignals`, `resolveMotionTier(signals: DeviceSignals): MotionTier`, `readDeviceSignals(): DeviceSignals`
  - `@/lib/motion/MotionTierProvider` → `<MotionTierProvider>`, `useMotionTier(): MotionTier`
  - `@/lib/motion/SmoothScroll` → `<SmoothScroll>`
  - `@/components/motion/Reveal` → `<Reveal delay?: number; className?: string>` (không có prop `as` — không task nào cần render đa hình, YAGNI)

- [ ] **Step 1: Viết test cho logic phân tầng**

Tạo `src/lib/motion/__tests__/tier.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { resolveMotionTier, type DeviceSignals } from '../tier'

const strongDesktop: DeviceSignals = {
  prefersReducedMotion: false,
  coarsePointer: false,
  deviceMemory: 16,
  hardwareConcurrency: 12,
}

describe('resolveMotionTier', () => {
  it('trả về full cho desktop mạnh', () => {
    expect(resolveMotionTier(strongDesktop)).toBe('full')
  })

  it('prefers-reduced-motion thắng mọi tín hiệu khác', () => {
    expect(resolveMotionTier({ ...strongDesktop, prefersReducedMotion: true })).toBe('reduced')
  })

  it('con trỏ thô (cảm ứng) xuống lite dù máy mạnh', () => {
    expect(resolveMotionTier({ ...strongDesktop, coarsePointer: true })).toBe('lite')
  })

  it('RAM thấp xuống lite', () => {
    expect(resolveMotionTier({ ...strongDesktop, deviceMemory: 4 })).toBe('lite')
  })

  it('ít nhân CPU xuống lite', () => {
    expect(resolveMotionTier({ ...strongDesktop, hardwareConcurrency: 4 })).toBe('lite')
  })

  it('trình duyệt không báo deviceMemory thì không bị phạt oan', () => {
    expect(
      resolveMotionTier({ ...strongDesktop, deviceMemory: undefined }),
    ).toBe('full')
  })

  it('trình duyệt không báo hardwareConcurrency thì không bị phạt oan', () => {
    expect(
      resolveMotionTier({ ...strongDesktop, hardwareConcurrency: undefined }),
    ).toBe('full')
  })
})
```

Hai test cuối quan trọng: Safari không expose `deviceMemory`. Nếu code xử lý `undefined` như "máy yếu" thì toàn bộ người dùng Safari desktop sẽ mất hiệu ứng — lỗi im lặng, rất khó phát hiện bằng mắt.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/motion`
Expected: FAIL — `Cannot find module '../tier'`

- [ ] **Step 3: Viết logic phân tầng**

Tạo `src/lib/motion/tier.ts`:

```ts
export type MotionTier = 'reduced' | 'lite' | 'full'

export interface DeviceSignals {
  prefersReducedMotion: boolean
  coarsePointer: boolean
  /** navigator.deviceMemory — Safari không có, sẽ là undefined. */
  deviceMemory?: number
  /** navigator.hardwareConcurrency — hầu hết trình duyệt đều có. */
  hardwareConcurrency?: number
}

const LOW_MEMORY_GB = 4
const LOW_CORE_COUNT = 4

/**
 * Hàm thuần để test được không cần DOM.
 *
 * Quy tắc: tín hiệu thiếu (undefined) KHÔNG bị coi là máy yếu. Safari không
 * expose deviceMemory; phạt undefined sẽ tắt hiệu ứng của toàn bộ Safari desktop.
 */
export function resolveMotionTier(signals: DeviceSignals): MotionTier {
  if (signals.prefersReducedMotion) return 'reduced'

  const lowMemory = signals.deviceMemory !== undefined && signals.deviceMemory <= LOW_MEMORY_GB
  const lowCores =
    signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency <= LOW_CORE_COUNT

  if (signals.coarsePointer || lowMemory || lowCores) return 'lite'
  return 'full'
}

/** Đọc tín hiệu thật từ trình duyệt. Chỉ gọi ở client. */
export function readDeviceSignals(): DeviceSignals {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
  }
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test src/lib/motion`
Expected: PASS 7 test tier + 4 test token

- [ ] **Step 5: Viết provider**

Tạo `src/lib/motion/MotionTierProvider.tsx`:

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { readDeviceSignals, resolveMotionTier, type MotionTier } from './tier'

/**
 * Mặc định 'reduced' trước khi đo được thiết bị. Render lần đầu không chạy
 * animation nào — an toàn hơn là bật hiệu ứng rồi tắt, vốn gây nháy.
 */
const MotionTierContext = createContext<MotionTier>('reduced')

export function MotionTierProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<MotionTier>('reduced')

  useEffect(() => {
    const update = () => setTier(resolveMotionTier(readDeviceSignals()))
    update()

    // Người dùng có thể bật/tắt reduce motion trong lúc đang xem trang.
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return <MotionTierContext.Provider value={tier}>{children}</MotionTierContext.Provider>
}

export function useMotionTier(): MotionTier {
  return useContext(MotionTierContext)
}
```

- [ ] **Step 6: Viết cầu nối Lenis ↔ ScrollTrigger**

Tạo `src/lib/motion/SmoothScroll.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { useMotionTier } from './MotionTierProvider'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const tier = useMotionTier()

  useEffect(() => {
    if (tier === 'reduced') return

    let cancelled = false
    let cleanup: (() => void) | undefined

    // Import động: Lenis và GSAP không nằm trong bundle ban đầu.
    const setup = async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return

      gsap.registerPlugin(ScrollTrigger)

      const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })

      // ScrollTrigger phải cập nhật theo tiến độ của Lenis, không theo sự kiện
      // scroll gốc — nếu không, vị trí pin sẽ trễ một frame và thấy rung.
      lenis.on('scroll', ScrollTrigger.update)

      const raf = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)

      cleanup = () => {
        gsap.ticker.remove(raf)
        lenis.destroy()
        // Không kill ScrollTrigger ở đây. Component nào tạo trigger thì tự kill
        // trong cleanup của mình; kill toàn cục sẽ xoá luôn trigger mà component
        // con vừa tạo lại khi tier đổi, vì thứ tự cleanup parent/child không đảm bảo.
      }
    }

    setup().catch((error) => {
      console.error('Không khởi tạo được smooth scroll; trang vẫn cuộn bình thường.', error)
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [tier])

  return <>{children}</>
}
```

- [ ] **Step 7: Viết component Reveal**

Tạo `src/components/motion/Reveal.tsx`:

```tsx
'use client'

import { motion } from 'motion/react'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { distance, duration, easingArray } from '@/lib/motion/tokens'

interface RevealProps {
  children: React.ReactNode
  /** Trễ thêm, đơn vị giây. Dùng cùng `stagger` khi reveal một nhóm. */
  delay?: number
  className?: string
}

/**
 * Component reveal dùng chung cho MỌI hiệu ứng vào-viewport.
 *
 * Không viết `whileInView` trực tiếp trong section: timing sẽ trôi dạt mỗi nơi
 * một kiểu và không thể chỉnh tập trung.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const tier = useMotionTier()
  const shouldTranslate = tier !== 'reduced'

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: shouldTranslate ? distance : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{
        duration: tier === 'reduced' ? duration.fast : duration.slow,
        delay,
        ease: easingArray.enter,
      }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 8: Gắn provider vào layout**

Trong `src/app/[locale]/layout.tsx`, bọc `children` bằng hai provider mới:

```tsx
import { MotionTierProvider } from '@/lib/motion/MotionTierProvider'
import { SmoothScroll } from '@/lib/motion/SmoothScroll'
```

Đổi phần thân `<body>` thành:

```tsx
<body>
  <NextIntlClientProvider messages={messages}>
    <MotionTierProvider>
      <SmoothScroll>{children}</SmoothScroll>
    </MotionTierProvider>
  </NextIntlClientProvider>
</body>
```

- [ ] **Step 9: Kiểm chứng thủ công**

Sửa tạm `src/app/[locale]/page.tsx` để có nội dung dài và bọc vài khối trong `<Reveal>`, chạy `pnpm dev`, kiểm tra:
- Scroll có cảm giác trôi mượt (Lenis đang chạy)
- Các khối `<Reveal>` hiện dần khi vào viewport
- Bật "Reduce motion" trong cài đặt hệ điều hành, tải lại: scroll trở về bình thường, khối chỉ fade không dịch chuyển

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: nền tảng animation — 3 tầng degradation, Reveal, Lenis+ScrollTrigger

resolveMotionTier là hàm thuần có test, cố ý không phạt trình duyệt thiếu
deviceMemory (Safari) để không tắt hiệu ứng oan. Lenis và GSAP import động,
không nằm trong bundle ban đầu và tắt hẳn ở tầng reduced.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Pipeline ảnh

**Files:**
- Create: `scripts/build-media.ts`, `scripts/build-placeholders.ts`, `src/components/media/Media.tsx`
- Modify: `src/lib/media/loader.ts` (thay stub Task 1 buộc phải tạo), `next.config.ts`, `package.json`
- Test: `src/lib/media/__tests__/loader.test.ts`

**Interfaces:**
- Consumes: `@/lib/content` types (Task 2)
- Produces:
  - `@/lib/media/loader` → default export `mediaLoader({ src, width, quality })`, hằng `MEDIA_WIDTHS = [640, 1024, 1600, 2400]`
  - `@/components/media/Media` → `<Media media={ImageAsset} locale sizes priority? className? />`

- [ ] **Step 1: Viết test cho loader**

Tạo `src/lib/media/__tests__/loader.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import mediaLoader, { MEDIA_WIDTHS } from '../loader'

describe('mediaLoader', () => {
  it('chọn biến thể nhỏ nhất đủ lớn cho bề rộng yêu cầu', () => {
    expect(mediaLoader({ src: '/media/a.avif', width: 800, quality: 75 })).toBe(
      '/media/a-1024.avif',
    )
  })

  it('khớp chính xác khi bề rộng trùng một mốc', () => {
    expect(mediaLoader({ src: '/media/a.avif', width: 1024, quality: 75 })).toBe(
      '/media/a-1024.avif',
    )
  })

  it('dùng biến thể lớn nhất khi yêu cầu vượt mọi mốc', () => {
    expect(mediaLoader({ src: '/media/a.avif', width: 4000, quality: 75 })).toBe(
      `/media/a-${MEDIA_WIDTHS.at(-1)}.avif`,
    )
  })

  it('giữ nguyên URL tuyệt đối vì file đó do CDN ngoài phục vụ', () => {
    const url = 'https://cdn.example.com/a.avif'
    expect(mediaLoader({ src: url, width: 800, quality: 75 })).toBe(url)
  })

  it('không thêm hậu tố hai lần cho src đã có sẵn mốc', () => {
    expect(mediaLoader({ src: '/media/a-1024.avif', width: 800, quality: 75 })).toBe(
      '/media/a-1024.avif',
    )
  })

  it('xử lý được đường dẫn nhiều cấp có dấu chấm trong tên thư mục', () => {
    expect(mediaLoader({ src: '/media/tours/ha.giang/x.avif', width: 600, quality: 75 })).toBe(
      '/media/tours/ha.giang/x-640.avif',
    )
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/media`
Expected: FAIL — `Cannot find module '../loader'`

- [ ] **Step 3: Viết loader**

Tạo `src/lib/media/loader.ts`:

```ts
export const MEDIA_WIDTHS = [640, 1024, 1600, 2400] as const

const VARIANT_SUFFIX = new RegExp(`-(${MEDIA_WIDTHS.join('|')})\\.[a-z0-9]+$`, 'i')

interface LoaderArgs {
  src: string
  width: number
  quality?: number
}

/**
 * Custom loader cho next/image.
 *
 * Ảnh đã được sinh sẵn nhiều kích thước lúc build (scripts/build-media.ts), nên
 * loader chỉ việc ánh xạ bề rộng yêu cầu sang tên file có sẵn. Vercel không phải
 * biến đổi ảnh nào, chi phí image optimization bằng không.
 */
export default function mediaLoader({ src, width }: LoaderArgs): string {
  if (/^https?:\/\//.test(src)) return src
  if (VARIANT_SUFFIX.test(src)) return src

  const target = MEDIA_WIDTHS.find((w) => w >= width) ?? MEDIA_WIDTHS[MEDIA_WIDTHS.length - 1]

  const lastDot = src.lastIndexOf('.')
  if (lastDot === -1 || lastDot < src.lastIndexOf('/')) return src

  return `${src.slice(0, lastDot)}-${target}${src.slice(lastDot)}`
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test src/lib/media`
Expected: PASS 6 test

- [ ] **Step 5: Viết script sinh ảnh**

Tạo `scripts/build-media.ts`:

```ts
/**
 * Sinh ảnh AVIF + WebP nhiều kích thước và blur placeholder từ ảnh gốc.
 *
 * Vào:  assets-src/**\/*.{jpg,jpeg,png,webp}
 * Ra:   public/media/<đường dẫn tương đối>-<width>.{avif,webp}
 *
 * Chạy: pnpm media
 *
 * In ra bảng metadata (src, width, height, blurDataURL) để dán vào content JSON.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC_DIR = path.join(process.cwd(), 'assets-src')
const OUT_DIR = path.join(process.cwd(), 'public', 'media')
const WIDTHS = [640, 1024, 1600, 2400]
const INPUT_EXT = /\.(jpe?g|png|webp|tiff?)$/i

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : Promise.resolve([full])
    }),
  )
  return files.flat().filter((f) => INPUT_EXT.test(f))
}

async function processImage(file: string) {
  const relative = path.relative(SRC_DIR, file)
  const relativeNoExt = relative.replace(INPUT_EXT, '')
  const outPath = path.join(OUT_DIR, relativeNoExt)
  await mkdir(path.dirname(outPath), { recursive: true })

  const image = sharp(file)
  const meta = await image.metadata()
  const originalWidth = meta.width ?? WIDTHS[WIDTHS.length - 1]
  const originalHeight = meta.height ?? 0

  // Sinh ĐỦ cả bốn mốc, kể cả khi ảnh gốc nhỏ hơn mốc đó.
  //
  // Lý do: loader là hàm thuần, không biết ảnh nào có sẵn biến thể nào — nó luôn
  // ánh xạ bề rộng yêu cầu vào một trong bốn mốc. Bỏ qua một mốc nghĩa là ảnh vỡ
  // ở đúng breakpoint đó, và lỗi chỉ lộ ra trên màn hình lớn.
  //
  // withoutEnlargement giữ cho ảnh không bị phóng to thật: file ở mốc lớn chỉ
  // chứa đúng kích thước gốc. Tốn thêm chút dung lượng, đổi lấy việc không bao
  // giờ 404.
  for (const width of WIDTHS) {
    const resize = { width, withoutEnlargement: true } as const
    await sharp(file).resize(resize).avif({ quality: 60 }).toFile(`${outPath}-${width}.avif`)
    await sharp(file).resize(resize).webp({ quality: 72 }).toFile(`${outPath}-${width}.webp`)
  }

  const largest = WIDTHS[WIDTHS.length - 1]
  if (originalWidth < largest) {
    console.warn(
      `⚠ ${relative} chỉ rộng ${originalWidth}px, nhỏ hơn mốc lớn nhất ${largest}px.\n` +
        '  Ảnh vẫn hiển thị được nhưng sẽ mờ trên màn hình lớn — nên thay bằng bản độ phân giải cao hơn.',
    )
  }

  // Blur placeholder: ảnh 16px rất nhẹ, nhúng thẳng vào JSON dưới dạng data URL.
  const blur = await sharp(file).resize(16).webp({ quality: 40 }).toBuffer()

  return {
    src: `/media/${relativeNoExt.split(path.sep).join('/')}.avif`,
    alt: { vi: 'TODO: viết alt mô tả nội dung ảnh' },
    width: Math.min(originalWidth, WIDTHS[WIDTHS.length - 1]),
    height: Math.round(
      (Math.min(originalWidth, WIDTHS[WIDTHS.length - 1]) / originalWidth) * originalHeight,
    ),
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
  }
}

async function main() {
  const files = await walk(SRC_DIR)
  if (files.length === 0) {
    console.log('Không tìm thấy ảnh nào trong assets-src/. Bỏ qua.')
    return
  }

  const results = []
  for (const file of files) {
    results.push(await processImage(file))
    console.log(`✓ ${path.relative(SRC_DIR, file)}`)
  }

  const manifestPath = path.join(process.cwd(), 'content', 'media-manifest.json')
  await writeFile(manifestPath, JSON.stringify(results, null, 2), 'utf8')
  console.log(`\nĐã ghi metadata của ${results.length} ảnh vào content/media-manifest.json`)
  console.log('Copy các khối cần dùng sang content/tours/*.json và điền alt tiếng Việt.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

Chuỗi `alt` để `TODO` là **có chủ đích**: script không thể tự biết ảnh chụp gì, và alt sai còn tệ hơn alt trống. Người nhập nội dung phải điền. Đây không phải placeholder trong plan mà là output có chủ ý của công cụ.

- [ ] **Step 5b: Đồng bộ breakpoint của next/image với MEDIA_WIDTHS**

Mặc định `next/image` dựng srcset từ `deviceSizes` gồm 640/750/828/1080/1200/1920/2048/3840. Loader gộp tất cả về bốn mốc, nên srcset sẽ có 8 mục trỏ vào chỉ 4 file — thừa và khó đọc khi debug.

Trong `next.config.ts`, thêm vào khối `images`:

```ts
  images: {
    loader: 'custom',
    loaderFile: './src/lib/media/loader.ts',
    // Khớp đúng MEDIA_WIDTHS trong src/lib/media/loader.ts. Lệch hai danh sách
    // này sẽ sinh srcset có mục trùng nhau.
    deviceSizes: [640, 1024, 1600, 2400],
  },
```

- [ ] **Step 6: Viết component Media**

Tạo `src/components/media/Media.tsx`:

```tsx
import Image from 'next/image'
import type { ImageAsset } from '@/lib/content'

interface MediaProps {
  media: ImageAsset
  /** Bắt buộc — quyết định trình duyệt tải biến thể nào. Sai `sizes` là hỏng LCP. */
  sizes: string
  locale: 'vi' | 'en'
  priority?: boolean
  className?: string
  fill?: boolean
}

export function Media({ media, sizes, locale, priority, className, fill }: MediaProps) {
  const alt = media.alt[locale] ?? media.alt.vi

  return (
    <Image
      src={media.src}
      alt={alt}
      {...(fill ? { fill: true } : { width: media.width, height: media.height })}
      sizes={sizes}
      placeholder="blur"
      blurDataURL={media.blurDataURL}
      priority={priority}
      className={className}
    />
  )
}
```

- [ ] **Step 7: Tạo ảnh placeholder để dự án chạy được**

```bash
mkdir -p public/media/placeholder
pnpm dlx tsx -e "
import sharp from 'sharp'
const make = async (name: string, w: number, h: number) => {
  const base = sharp({ create: { width: w, height: h, channels: 3, background: { r: 20, g: 26, b: 33 } } })
  for (const width of [640, 1024, 1600, 2400]) {
    if (width > w) continue
    await base.clone().resize(width).avif({ quality: 60 }).toFile(\`public/media/placeholder/\${name}-\${width}.avif\`)
  }
}
await make('hero', 2400, 1350)
await make('gallery-1', 1600, 1067)
await make('og', 1200, 630)
console.log('done')
"
```

- [ ] **Step 8: Xác minh build**

Run: `pnpm test && pnpm build`
Expected: test PASS; build thành công.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: pipeline ảnh — sharp sinh AVIF/WebP nhiều size, custom loader

Ảnh sinh sẵn lúc build nên Vercel không phải biến đổi ảnh nào (chi phí image
optimization bằng 0). Loader là hàm thuần có test, xử lý đúng URL tuyệt đối và
đường dẫn có dấu chấm trong tên thư mục.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Layout shell — header, footer, page transition

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/PageTransition.tsx`
- Modify: `src/app/[locale]/layout.tsx`, `messages/vi.json`

**Interfaces:**
- Consumes: `useMotionTier()` (Task 3), `getHomeContent()` (Task 2), `messages/vi.json` (Task 1)
- Produces: `<Header contact={HomeContent['contact']} />`, `<Footer contact={HomeContent['contact']} />`, `<PageTransition>`

- [ ] **Step 1: Dọn cảnh báo Vitest còn tồn đọng**

Từ Task 1, mỗi lần `pnpm test` đều in:

```
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'` ...
  - ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1)
```

Việc này vi phạm ràng buộc "test output phải sạch" và đã bị báo ở cả bốn task đầu.

```bash
git mv vitest.config.ts vitest.config.mts
```

Đổi đuôi sang `.mts` thay vì thêm `"type": "module"` vào `package.json`: cách thứ hai đổi cách giải nghĩa module của toàn dự án và có thể lan sang `next.config.ts` lẫn `postcss.config.mjs`, trong khi ở đây chỉ cần một file được nạp dưới dạng ESM.

Chạy `pnpm test` và xác nhận cảnh báo đã biến mất, số test vẫn nguyên.

- [ ] **Step 2: Thêm tên thương hiệu vào messages**

Thêm khoá `brand` vào đầu `messages/vi.json` (giữ nguyên các khoá đã có):

```json
"brand": {
  "name": "RosaTravel"
},
```

Tên thương hiệu là danh từ riêng, không dịch, nhưng vẫn đặt trong messages để đổi ở một chỗ duy nhất thay vì rải rác trong nhiều component.

- [ ] **Step 3: Viết Header**

Tạo `src/components/layout/Header.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion, useScroll, useTransform } from 'motion/react'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import type { HomeContent } from '@/lib/content'

export function Header({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('nav')
  const tc = useTranslations('cta')
  const tb = useTranslations('brand')
  const tier = useMotionTier()
  const { scrollY } = useScroll()

  // Nền header đậm dần khi rời khỏi hero. Chỉ đổi opacity — không animate
  // backdrop-filter hay background-color, cả hai đều buộc trình duyệt vẽ lại.
  // Hook luôn được gọi vô điều kiện; chỉ giá trị dùng mới phụ thuộc tier.
  const scrolledOpacity = useTransform(scrollY, [0, 240], [0, 1])

  // Tier reduced: cắt hẳn liên kết với scroll, để nền đặc cố định. Hiệu ứng
  // buộc vào vị trí cuộn vẫn là chuyển động dù chỉ đổi opacity, và ở đây đọc
  // được chữ quan trọng hơn việc hoà vào ảnh hero.
  const overlayOpacity = tier === 'reduced' ? 1 : scrolledOpacity

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        aria-hidden
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm"
      />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-xl">
          {tb('name')}
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/lien-he" className="hover:text-sand-400 transition-colors">
            {t('contact')}
          </Link>
          <a
            href={contact.zaloUrl}
            className="rounded-full bg-clay-500 px-5 py-2 font-medium transition-transform hover:scale-105"
          >
            {tc('zalo')}
          </a>
        </div>
      </nav>
    </header>
  )
}
```

- [ ] **Step 4: Viết Footer**

Tạo `src/components/layout/Footer.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import type { HomeContent } from '@/lib/content'

export function Footer({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('cta')
  const tb = useTranslations('brand')

  return (
    <footer className="border-t border-ink-700 px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {tb('name')}
        </p>
        <div className="flex gap-6">
          <a href={`tel:${contact.phone}`} className="hover:text-sand-100">
            {t('callUs')}: {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`} className="hover:text-sand-100">
            {contact.email}
          </a>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Viết PageTransition**

Tạo `src/components/layout/PageTransition.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { duration, easingArray } from '@/lib/motion/tokens'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const tier = useMotionTier()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: tier === 'reduced' ? duration.fast : duration.base,
          ease: easingArray.enter,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

Chỉ fade, không trượt. Page transition có dịch chuyển làm trang cảm giác chậm hơn thực tế, và trên trang bán hàng thì tốc độ quan trọng hơn hiệu ứng.

- [ ] **Step 6: Gắn vào layout**

Trong `src/app/[locale]/layout.tsx`, thêm import và đọc contact từ content layer:

```tsx
import { getHomeContent } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'
```

Trong thân component, trước `return`:

```tsx
const { contact } = await getHomeContent()
```

Và đổi phần trong `<SmoothScroll>` thành:

```tsx
<SmoothScroll>
  <Header contact={contact} />
  <PageTransition>{children}</PageTransition>
  <Footer contact={contact} />
</SmoothScroll>
```

- [ ] **Step 7: Xác minh**

Run: `pnpm test && pnpm build`
Expected: test pass với output sạch (không còn cảnh báo Vite); build pass.

Kiểm tra thủ công cần con người (agent không mở được dev server): header trong suốt ở đầu trang và nền đậm dần khi cuộn xuống; footer hiện số điện thoại lấy từ `content/home.json`; logo hiển thị `RosaTravel`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: layout shell — header dính, footer, page transition fade

Header đổi nền bằng opacity thay vì background-color để không buộc trình duyệt
vẽ lại mỗi frame. Thông tin liên hệ đọc từ content layer, không hard-code.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Cinematic beat #1 — Hero video scrub

Task khó nhất về kỹ thuật. Làm sớm để phát hiện vấn đề hiệu năng khi còn dễ sửa.

**Files:**
- Create: `src/components/home/HeroCinematic.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `useMotionTier()`, `<Media>`, `isVideoAsset`, `HomeContent['hero']`
- Produces: `<HeroCinematic hero={HomeContent['hero']} locale={Locale} />`

- [ ] **Step 1: Viết HeroCinematic**

Tạo `src/components/home/HeroCinematic.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
// Type-only import: bị xoá lúc biên dịch nên không kéo fs.ts vào bundle trình duyệt.
import type { HomeContent } from '@/lib/content'
// Giá trị runtime phải lấy từ guards, KHÔNG từ barrel '@/lib/content'.
import { isVideoAsset } from '@/lib/content/guards'
import { Media } from '@/components/media/Media'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { scrubSmoothing, scrubTweenDuration } from '@/lib/motion/tokens'

interface HeroCinematicProps {
  hero: HomeContent['hero']
  locale: 'vi' | 'en'
}

export function HeroCinematic({ hero, locale }: HeroCinematicProps) {
  const tier = useMotionTier()
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)

  const video = isVideoAsset(hero.media) ? hero.media : null
  // Ảnh nền: poster của video nếu hero là video, ngược lại chính hero.media.
  // Gọi lại isVideoAsset ở đây (thay vì dùng biến `video`) để TypeScript thu hẹp
  // kiểu về ImageAsset — ternary trên `video` không phải type guard cho hero.media.
  const stillImage = isVideoAsset(hero.media) ? hero.media.poster : hero.media
  // Pin và reveal tiêu đề chạy ở MỌI hero tier full, kể cả khi chỉ có ảnh tĩnh.
  // Buộc chung điều kiện với video là sai: nội dung có thể không bao giờ có
  // video, và khi đó hero sẽ đứng im hoàn toàn — một "cinematic beat" không
  // chuyển động.
  const canPin = tier === 'full'

  // Scrub chỉ khi thật sự có video scrub được.
  const canScrub = canPin && video?.scrubbable === true

  useEffect(() => {
    if (!canPin) return
    const section = sectionRef.current
    if (!section) return
    const videoEl = videoRef.current

    let cancelled = false
    let cleanup: (() => void) | undefined

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      // Phải đợi metadata mới biết duration. Nếu không, progress * NaN = NaN
      // và video đứng im — lỗi này rất hay gặp và nhìn giống "scrub không chạy".
      const waitForMetadata = () =>
        videoEl.readyState >= 1
          ? Promise.resolve()
          : new Promise<void>((resolve) =>
              videoEl.addEventListener('loadedmetadata', () => resolve(), { once: true }),
            )

      // Chỉ cần đợi metadata khi thật sự scrub video.
      if (canScrub && videoEl) {
        await waitForMetadata()
        if (cancelled) return
      }

      // Gán currentTime qua một object trung gian để gsap nội suy mượt,
      // thay vì nhảy thẳng theo progress (gây giật khi cuộn nhanh).
      const proxy = { time: 0 }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        // Quãng cuộn thuộc về bố cục của section này chứ không phải timing dùng
        // chung — để tại chỗ, không đưa vào token. Có video thì giữ pin lâu hơn
        // để đủ chỗ tua hết clip; chỉ có ảnh thì một màn hình là vừa đủ cho
        // reveal tiêu đề, giữ lâu hơn sẽ thành chặn đường người đọc.
        end: canScrub ? '+=180%' : '+=100%',
        pin: true,
        scrub: scrubSmoothing,
        onUpdate: !canScrub || !videoEl ? undefined : (self) => {
          proxy.time = self.progress * videoEl.duration
          gsap.to(videoEl, {
            currentTime: proxy.time,
            duration: scrubTweenDuration,
            overwrite: true,
            ease: 'none',
          })
        },
      })

      const headlineTween = gsap.fromTo(
        headlineRef.current,
        { yPercent: 0, opacity: 1 },
        {
          yPercent: -40,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '+=90%', scrub: scrubSmoothing },
        },
      )

      cleanup = () => {
        trigger.kill()
        headlineTween.scrollTrigger?.kill()
        headlineTween.kill()
      }
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [canPin, canScrub])

  return (
    <section ref={sectionRef} className="relative h-svh w-full overflow-hidden">
      {video && tier === 'full' ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          poster={video.poster.src}
          {...(canScrub ? {} : { autoPlay: true, loop: true })}
        >
          <source src={video.webm} type="video/webm" />
          <source src={video.mp4} type="video/mp4" />
        </video>
      ) : (
        <Media
          media={stillImage}
          locale={locale}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950" />

      <div ref={headlineRef} className="relative flex h-full items-end px-6 pb-24">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-tight sm:text-6xl lg:text-7xl">
            {hero.headline[locale] ?? hero.headline.vi}
          </h1>
          <p className="mt-4 max-w-xl text-sand-200">
            {hero.subline[locale] ?? hero.subline.vi}
          </p>
        </div>
      </div>
    </section>
  )
}
```

Ở tier `lite` và `reduced`, section chỉ hiển thị ảnh poster tĩnh — không pin, không scrub, không tải video. Đây là lý do `preload` chỉ bật khi `tier === 'full'`: mobile không phải tải file video vài MB mà không bao giờ dùng tới.

- [ ] **Step 2: Gắn vào trang chủ**

Ghi đè `src/app/[locale]/page.tsx`:

```tsx
import { setRequestLocale } from 'next-intl/server'
import { getHomeContent } from '@/lib/content'
import { HeroCinematic } from '@/components/home/HeroCinematic'
import type { Locale } from '@/i18n/routing'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const home = await getHomeContent()

  return (
    <main>
      <HeroCinematic hero={home.hero} locale={locale} />
      <div className="h-screen" />
    </main>
  )
}
```

Khối `h-screen` là chỗ giữ tạm để kiểm tra pin nhả đúng; sẽ bị thay ở Task 7.

- [ ] **Step 3: Kiểm chứng thủ công**

`pnpm dev`, mở `/vi`:
- Cuộn xuống: hero bị pin lại, tiêu đề trôi lên và mờ dần, nhả pin sau khoảng 1.8 màn hình
- Thu nhỏ cửa sổ xuống chế độ mobile (hoặc dùng DevTools device mode): không còn pin, chỉ thấy ảnh tĩnh
- Bật Reduce motion: giống mobile

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: cinematic beat #1 — hero video scrub theo scroll

Đợi loadedmetadata trước khi tính currentTime (nếu không, progress * NaN làm
video đứng im). Nội suy currentTime qua gsap.to thay vì gán thẳng để không giật
khi cuộn nhanh. Tier lite/reduced chỉ hiển thị poster và không tải video.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Trang chủ — Vì sao chọn chúng tôi và lưới tour

**Files:**
- Create: `src/components/home/WhyUs.tsx`, `src/components/home/TourGrid.tsx`, `src/components/home/TourCard.tsx`
- Create: `src/lib/format.ts`
- Modify: `src/app/[locale]/page.tsx`
- Test: `src/lib/__tests__/format.test.ts`

**Interfaces:**
- Consumes: `<Reveal>`, `<Media>`, `getTours()`, `stagger`
- Produces: `formatPrice(amount: number, locale: string): string`, `<WhyUs items locale />`, `<TourGrid tours locale />`

- [ ] **Step 1: Viết test cho định dạng giá**

Tạo `src/lib/__tests__/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatPrice } from '../format'

describe('formatPrice', () => {
  it('định dạng tiền Việt có dấu phân cách nghìn', () => {
    // Intl dùng ký tự khoảng trắng hẹp không ngắt cho vi-VN; so sánh phần số.
    expect(formatPrice(6900000, 'vi')).toMatch(/6\.900\.000/)
  })

  it('không hiển thị phần thập phân cho VND', () => {
    expect(formatPrice(6900000, 'vi')).not.toContain(',00')
  })

  it('kèm ký hiệu đơn vị', () => {
    expect(formatPrice(6900000, 'vi')).toMatch(/₫|VND/)
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/__tests__`
Expected: FAIL — `Cannot find module '../format'`

- [ ] **Step 3: Viết hàm định dạng**

Tạo `src/lib/format.ts`:

```ts
export function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test src/lib/__tests__`
Expected: PASS 3 test

- [ ] **Step 5: Viết WhyUs**

Tạo `src/components/home/WhyUs.tsx`:

```tsx
import { Reveal } from '@/components/motion/Reveal'
import { stagger } from '@/lib/motion/tokens'
import type { HomeContent } from '@/lib/content'

interface WhyUsProps {
  items: HomeContent['whyUs']
  locale: 'vi' | 'en'
}

export function WhyUs({ items, locale }: WhyUsProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-(--spacing-section)">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.title.vi} delay={index * stagger}>
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl">
              {item.title[locale] ?? item.title.vi}
            </h3>
            <p className="mt-3 text-ink-500">{item.body[locale] ?? item.body.vi}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Viết TourCard và TourGrid**

Tạo `src/components/home/TourCard.tsx`:

```tsx
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { formatPrice } from '@/lib/format'
import { isVideoAsset, type Tour } from '@/lib/content'

export function TourCard({ tour, locale }: { tour: Tour; locale: 'vi' | 'en' }) {
  const t = useTranslations('tour')
  const cover = isVideoAsset(tour.heroMedia) ? tour.heroMedia.poster : tour.heroMedia

  return (
    <Link href={`/tour/${tour.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
        <Media
          media={cover}
          locale={locale}
          fill
          // Lưới tối đa max-w-7xl (1280px), 3 cột + khoảng cách => thẻ dừng ở
          // ~426px. Để 33vw thì trên màn hình 2560px trình duyệt sẽ đòi ~845px
          // và tải biến thể to vô ích.
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 426px"
          className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-hover)] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl">
            {tour.title[locale] ?? tour.title.vi}
          </h3>
          <p className="mt-1 text-sm text-sand-200">
            {t('durationDays', { n: tour.durationDays })} · {t('priceFrom')}{' '}
            {formatPrice(tour.priceFrom, locale)}
          </p>
        </div>
      </div>
    </Link>
  )
}
```

Hiệu ứng hover dùng CSS `transition-transform` chứ không dùng Motion: hover là trạng thái CSS thuần, đưa qua JavaScript chỉ thêm việc cho main thread mà không đổi kết quả.

Tạo `src/components/home/TourGrid.tsx`:

```tsx
import { Reveal } from '@/components/motion/Reveal'
import { stagger } from '@/lib/motion/tokens'
import { TourCard } from './TourCard'
import type { Tour } from '@/lib/content'

export function TourGrid({ tours, locale }: { tours: Tour[]; locale: 'vi' | 'en' }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-(--spacing-section)">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour, index) => (
          <Reveal key={tour.slug} delay={index * stagger}>
            <TourCard tour={tour} locale={locale} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Gắn vào trang chủ**

Trong `src/app/[locale]/page.tsx`, thay khối `<div className="h-screen" />`:

```tsx
const home = await getHomeContent()
const allTours = await getTours()
const featured = home.featuredTourSlugs
  .map((slug) => allTours.find((t) => t.slug === slug))
  .filter((t): t is NonNullable<typeof t> => Boolean(t))
```

```tsx
<WhyUs items={home.whyUs} locale={locale} />
<TourGrid tours={featured} locale={locale} />
```

- [ ] **Step 8: Xác minh và commit**

```bash
pnpm test && pnpm build
git add -A
git commit -m "feat: trang chủ — section vì sao chọn và lưới tour nổi bật

Hover thẻ tour dùng CSS transition thay vì Motion: hover là trạng thái CSS
thuần, đẩy qua JS chỉ thêm việc cho main thread.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Cinematic beat #2 — Hành trình cuộn ngang

**Files:**
- Create: `src/components/home/JourneyCinematic.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `useMotionTier()`, `<Media>`, `<Reveal>`, `HomeContent['journey']`
- Produces: `<JourneyCinematic journey={HomeContent['journey']} locale />`

- [ ] **Step 1: Viết JourneyCinematic**

Tạo `src/components/home/JourneyCinematic.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import { scrubSmoothing, stagger } from '@/lib/motion/tokens'
import type { HomeContent } from '@/lib/content'

interface JourneyProps {
  journey: HomeContent['journey']
  locale: 'vi' | 'en'
}

export function JourneyCinematic({ journey, locale }: JourneyProps) {
  const tier = useMotionTier()
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const canPin = tier === 'full'

  useEffect(() => {
    if (!canPin) return
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      // Quãng cuộn ngang = phần tràn ra ngoài viewport. Dùng hàm thay vì giá trị
      // cố định để ScrollTrigger tính lại đúng khi đổi kích thước cửa sổ.
      //
      // Kẹp sàn về 0: hiện tại schema bắt tối thiểu 2 điểm đến và các phần tử
      // rộng theo vw nên tổng luôn vượt màn hình, nhưng ràng buộc đó nằm ở file
      // khác. Nếu ai đó thu hẹp vw hoặc hạ mức tối thiểu, quãng cuộn sẽ âm và
      // pin khoá màn hình mà không có gì di chuyển.
      const overflow = () => Math.max(0, track.scrollWidth - window.innerWidth)

      const tween = gsap.to(track, {
        x: () => -overflow(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${overflow()}`,
          pin: true,
          scrub: scrubSmoothing,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })

      cleanup = () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [canPin])

  const headline = journey.headline[locale] ?? journey.headline.vi

  if (!canPin) {
    // Tier lite/reduced: lưới dọc bình thường. Đây là một trải nghiệm hoàn chỉnh
    // riêng, không phải bản desktop bị cắt xén.
    return (
      <section className="mx-auto max-w-7xl px-6 py-(--spacing-section)">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
          {headline}
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {journey.stops.map((stop, index) => (
            <Reveal key={stop.label.vi} delay={index * stagger}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Media
                  media={stop.image}
                  locale={locale}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                <span className="absolute bottom-4 left-4 text-lg">
                  {stop.label[locale] ?? stop.label.vi}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="h-svh overflow-hidden">
      <div className="flex h-full items-center">
        <div ref={trackRef} className="flex gap-8 pl-6 will-change-transform">
          <div className="flex w-[40vw] shrink-0 items-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-5xl leading-tight">
              {headline}
            </h2>
          </div>
          {journey.stops.map((stop) => (
            <figure
              key={stop.label.vi}
              className="relative h-[70vh] w-[50vw] shrink-0 overflow-hidden rounded-lg"
            >
              <Media
                media={stop.image}
                locale={locale}
                fill
                sizes="50vw"
                className="object-cover"
              />
              <figcaption className="absolute bottom-6 left-6 text-2xl">
                {stop.label[locale] ?? stop.label.vi}
              </figcaption>
            </figure>
          ))}
          <div className="w-[10vw] shrink-0" aria-hidden />
        </div>
      </div>
    </section>
  )
}
```

`will-change-transform` chỉ đặt trên track đang thực sự chuyển động. Rải `will-change` khắp nơi làm trình duyệt tạo quá nhiều layer và phản tác dụng.

- [ ] **Step 2: Gắn vào trang chủ**

Thêm `<JourneyCinematic journey={home.journey} locale={locale} />` sau `<TourGrid>` trong `src/app/[locale]/page.tsx`.

- [ ] **Step 3: Xác minh**

`pnpm dev`, `/vi`: cuộn tới section — trang dừng lại, dải ảnh chạy ngang theo scroll, nhả pin khi hết dải. Thu nhỏ về mobile: thành lưới dọc 2 cột, không pin.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: cinematic beat #2 — hành trình cuộn ngang có pin

Quãng cuộn tính bằng hàm + invalidateOnRefresh để đổi kích thước cửa sổ không
làm lệch điểm nhả pin. Tier lite chuyển sang lưới dọc — một bố cục hoàn chỉnh
riêng chứ không phải bản desktop bị cắt.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Trang chủ — cảm nhận khách hàng và CTA cuối

**Files:**
- Create: `src/components/home/Testimonials.tsx`, `src/components/home/FinalCta.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `<Reveal>`, `<Media>`, `HomeContent['testimonials']`, `HomeContent['contact']`
- Produces: `<Testimonials items locale />`, `<FinalCta contact />`

- [ ] **Step 1: Viết Testimonials**

Tạo `src/components/home/Testimonials.tsx`:

```tsx
import { Reveal } from '@/components/motion/Reveal'
import { Media } from '@/components/media/Media'
import { stagger } from '@/lib/motion/tokens'
import type { Testimonial } from '@/lib/content'

export function Testimonials({
  items,
  locale,
}: {
  items: Testimonial[]
  locale: 'vi' | 'en'
}) {
  // Chưa có cảm nhận thật thì không render section rỗng.
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-6 py-(--spacing-section)">
      <div className="grid gap-10 sm:grid-cols-2">
        {items.map((item, index) => (
          <Reveal key={item.name} delay={index * stagger}>
            <figure>
              <blockquote className="font-[family-name:var(--font-playfair)] text-xl leading-relaxed">
                “{item.quote[locale] ?? item.quote.vi}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 text-sm text-ink-500">
                {item.avatar && (
                  <span className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Media
                      media={item.avatar}
                      locale={locale}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                )}
                {item.name}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Viết FinalCta**

Tạo `src/components/home/FinalCta.tsx`:

```tsx
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import type { HomeContent } from '@/lib/content'

export function FinalCta({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('cta')

  return (
    <section className="mx-auto max-w-3xl px-6 py-(--spacing-section) text-center">
      <Reveal>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl">
          {t('finalHeadline')}
        </h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/lien-he"
            className="rounded-full bg-clay-500 px-8 py-3 font-medium transition-transform hover:scale-105"
          >
            {t('bookNow')}
          </Link>
          <a
            href={`tel:${contact.phone}`}
            className="rounded-full border border-ink-700 px-8 py-3 transition-colors hover:border-sand-400"
          >
            {t('callUs')}
          </a>
          <a
            href={contact.zaloUrl}
            className="rounded-full border border-ink-700 px-8 py-3 transition-colors hover:border-sand-400"
          >
            {t('zalo')}
          </a>
        </div>
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 3: Gắn vào trang chủ**

Trong `src/app/[locale]/page.tsx`, thêm import và hai section vào cuối `<main>`:

```tsx
import { Testimonials } from '@/components/home/Testimonials'
import { FinalCta } from '@/components/home/FinalCta'
```

```tsx
<Testimonials items={home.testimonials} locale={locale} />
<FinalCta contact={home.contact} />
```

- [ ] **Step 4: Xác minh và commit**

Run: `pnpm build`
Expected: build pass. `content/home.json` có `testimonials: []` nên section cảm nhận không render — đúng thiết kế.

```bash
git add -A
git commit -m "feat: trang chủ — cảm nhận khách hàng và CTA cuối phễu

Section cảm nhận tự ẩn khi chưa có nội dung thật, không render khung rỗng.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Trang chi tiết tour và cinematic beat #3

**Files:**
- Create: `src/app/[locale]/tour/[slug]/page.tsx`, `src/components/tour/TourHero.tsx`, `src/components/tour/ItineraryCinematic.tsx`
- Modify: `messages/vi.json`

**Interfaces:**
- Consumes: `getTour()`, `getTourSlugs()`, `<Media>`, `<Reveal>`, `useMotionTier()`, `formatPrice`
- Produces: trang tĩnh `/[locale]/tour/[slug]`

- [ ] **Step 1: Viết TourHero**

Tạo `src/components/tour/TourHero.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { formatPrice } from '@/lib/format'
import { isVideoAsset, type Tour } from '@/lib/content'

export function TourHero({ tour, locale }: { tour: Tour; locale: 'vi' | 'en' }) {
  const t = useTranslations('tour')
  const cover = isVideoAsset(tour.heroMedia) ? tour.heroMedia.poster : tour.heroMedia

  return (
    <section className="relative h-[80svh] w-full overflow-hidden">
      <Media
        media={cover}
        locale={locale}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-16">
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-6xl">
          {tour.title[locale] ?? tour.title.vi}
        </h1>
        <p className="mt-3 text-lg text-sand-200">{tour.tagline[locale] ?? tour.tagline.vi}</p>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <dt className="text-ink-500">{t('duration')}</dt>
            <dd className="text-lg">{tour.durationDays} ngày</dd>
          </div>
          <div>
            <dt className="text-ink-500">{t('priceFrom')}</dt>
            <dd className="text-lg">{formatPrice(tour.priceFrom, locale)}</dd>
          </div>
          <div>
            <dt className="text-ink-500">{t('destinations')}</dt>
            <dd className="text-lg">
              {tour.destinations.map((d) => d[locale] ?? d.vi).join(' · ')}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Viết ItineraryCinematic**

Tạo `src/components/tour/ItineraryCinematic.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { useMotionTier } from '@/lib/motion/MotionTierProvider'
import type { ItineraryDay } from '@/lib/content'

export function ItineraryCinematic({
  days,
  locale,
}: {
  days: ItineraryDay[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('tour')
  const tier = useMotionTier()
  const rootRef = useRef<HTMLDivElement>(null)
  const canParallax = tier === 'full'

  useEffect(() => {
    if (!canParallax) return
    const root = rootRef.current
    if (!root) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const setup = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      const images = root.querySelectorAll<HTMLElement>('[data-parallax]')
      const tweens = Array.from(images).map((el) =>
        // Dịch bằng yPercent (transform) chứ không phải background-position:
        // background-position buộc trình duyệt vẽ lại toàn bộ vùng mỗi frame.
        gsap.fromTo(
          el,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.5,
            },
          },
        ),
      )

      cleanup = () => {
        tweens.forEach((tween) => {
          tween.scrollTrigger?.kill()
          tween.kill()
        })
      }
    }

    setup().catch((error) => {
      console.error('Không tải được GSAP để chạy parallax lịch trình:', error)
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [canParallax])

  return (
    <section ref={rootRef} className="mx-auto max-w-5xl px-6 py-(--spacing-section)">
      <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
        {t('itinerary')}
      </h2>
      <ol className="mt-12 space-y-20">
        {days.map((day) => (
          <li key={day.day}>
            <Reveal>
              <p className="text-sm uppercase tracking-widest text-clay-500">
                {t('day', { n: day.day })}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl">
                {day.title[locale] ?? day.title.vi}
              </h3>
              <p className="mt-3 text-ink-500">
                {day.description[locale] ?? day.description.vi}
              </p>
            </Reveal>
            {day.media && (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg">
                <div data-parallax className="absolute inset-x-0 -top-[8%] h-[116%]">
                  <Media
                    media={day.media}
                    locale={locale}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
```

Lớp bọc cao `116%` và lệch `-8%` là để ảnh còn dư khi dịch ±8%, không lộ mép trống.

- [ ] **Step 3: Viết trang tour**

Tạo `src/app/[locale]/tour/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getTour, getTourSlugs } from '@/lib/content'
import { TourHero } from '@/components/tour/TourHero'
import { ItineraryCinematic } from '@/components/tour/ItineraryCinematic'
import { Reveal } from '@/components/motion/Reveal'
import { routing, type Locale } from '@/i18n/routing'

type Params = Promise<{ locale: Locale; slug: string }>

export async function generateStaticParams() {
  const slugs = await getTourSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const tour = await getTour(slug)
  if (!tour) return {}

  const title = tour.seo.title[locale] ?? tour.seo.title.vi
  const description = tour.seo.description[locale] ?? tour.seo.description.vi

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: tour.seo.ogImage.src, width: 1200, height: 630 }],
      type: 'article',
    },
  }
}

export default async function TourPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const tour = await getTour(slug)
  if (!tour) notFound()

  return (
    <main>
      <TourHero tour={tour} locale={locale} />
      <section className="mx-auto max-w-3xl px-6 py-(--spacing-section)">
        <Reveal>
          <p className="text-xl leading-relaxed">{tour.summary[locale] ?? tour.summary.vi}</p>
        </Reveal>
      </section>
      <ItineraryCinematic days={tour.itinerary} locale={locale} />
    </main>
  )
}
```

- [ ] **Step 4: Xác minh và commit**

`pnpm build` — output phải cho thấy `/[locale]/tour/[slug]` là static với 1 route được sinh (`/vi/tour/mau-ha-giang`).

```bash
git add -A
git commit -m "feat: trang chi tiết tour và cinematic beat #3 parallax lịch trình

Parallax dịch bằng yPercent (transform) thay vì background-position để không
buộc trình duyệt vẽ lại vùng ảnh mỗi frame. Trang sinh tĩnh qua
generateStaticParams.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Trang tour — gallery và bao gồm/không bao gồm

**Files:**
- Create: `src/components/tour/Gallery.tsx`, `src/components/tour/InclusionList.tsx`, `src/components/tour/TourCta.tsx`
- Modify: `src/app/[locale]/tour/[slug]/page.tsx`

**Interfaces:**
- Consumes: `<Media>`, `<Reveal>`, `Tour['gallery']`, `Tour['inclusions']`, khoá `cta.tourHeadline` / `cta.tourSub` / `cta.bookNow`
- Produces: `<Gallery images locale />`, `<InclusionList inclusions exclusions locale />`, `<TourCta slug />`

- [ ] **Step 1: Viết Gallery**

Tạo `src/components/tour/Gallery.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import { Media } from '@/components/media/Media'
import { Reveal } from '@/components/motion/Reveal'
import { stagger } from '@/lib/motion/tokens'
import type { ImageAsset } from '@/lib/content'

export function Gallery({ images, locale }: { images: ImageAsset[]; locale: 'vi' | 'en' }) {
  const t = useTranslations('tour')

  return (
    <section className="mx-auto max-w-7xl px-6 py-(--spacing-section)">
      <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
        {t('gallery')}
      </h2>
      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <Reveal key={image.src} delay={(index % 3) * stagger} className="mb-4 break-inside-avoid">
            <Media
              media={image}
              locale={locale}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="w-full rounded-lg"
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

Bố cục masonry bằng CSS `columns` chứ không dùng thư viện masonry JS: ảnh tour có tỉ lệ khác nhau, và `columns` cho kết quả tương đương mà không tốn một dòng JavaScript nào. Trễ reveal dùng `index % 3` để cột nào cũng bắt đầu sớm, không để ảnh cuối chờ quá lâu.

- [ ] **Step 2: Viết InclusionList**

Tạo `src/components/tour/InclusionList.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'
import type { LocalizedText } from '@/lib/content'

export function InclusionList({
  inclusions,
  exclusions,
  locale,
}: {
  inclusions: LocalizedText[]
  exclusions: LocalizedText[]
  locale: 'vi' | 'en'
}) {
  const t = useTranslations('tour')
  const text = (item: LocalizedText) => item[locale] ?? item.vi

  return (
    <section className="mx-auto max-w-5xl px-6 py-(--spacing-section)">
      <div className="grid gap-12 sm:grid-cols-2">
        <Reveal>
          <h3 className="text-sm uppercase tracking-widest text-clay-500">{t('inclusions')}</h3>
          <ul className="mt-4 space-y-2">
            {inclusions.map((item) => (
              <li key={item.vi} className="border-b border-ink-700 pb-2">
                {text(item)}
              </li>
            ))}
          </ul>
        </Reveal>
        {exclusions.length > 0 && (
          <Reveal delay={0.06}>
            <h3 className="text-sm uppercase tracking-widest text-ink-500">{t('exclusions')}</h3>
            <ul className="mt-4 space-y-2 text-ink-500">
              {exclusions.map((item) => (
                <li key={item.vi} className="border-b border-ink-700 pb-2">
                  {text(item)}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Viết TourCta**

Spec mục 6 yêu cầu trang tour kết thúc bằng CTA liên hệ, và CTA phải mang theo slug để form điền sẵn tour.

Tạo `src/components/tour/TourCta.tsx`:

```tsx
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/motion/Reveal'

export function TourCta({ slug }: { slug: string }) {
  const t = useTranslations('cta')

  return (
    <section className="mx-auto max-w-3xl px-6 pb-(--spacing-section) text-center">
      <Reveal>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl">
          {t('tourHeadline')}
        </h2>
        <p className="mt-3 text-ink-500">{t('tourSub')}</p>
        {/* ?tour=<slug> được ContactForm đọc để chọn sẵn tour trong dropdown. */}
        <Link
          href={`/lien-he?tour=${slug}`}
          className="mt-8 inline-block rounded-full bg-clay-500 px-8 py-3 font-medium transition-transform hover:scale-105"
        >
          {t('bookNow')}
        </Link>
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 4: Gắn vào trang tour và commit**

Thêm vào `src/app/[locale]/tour/[slug]/page.tsx` sau `<ItineraryCinematic>`:

```tsx
<Gallery images={tour.gallery} locale={locale} />
<InclusionList inclusions={tour.inclusions} exclusions={tour.exclusions} locale={locale} />
<TourCta slug={tour.slug} />
```

Kiểm chứng: mở `/vi/tour/mau-ha-giang`, bấm CTA cuối trang — trang liên hệ phải mở với dropdown "Tour quan tâm" đã chọn sẵn đúng tour.

```bash
pnpm build
git add -A
git commit -m "feat: trang tour — gallery masonry và danh sách bao gồm

Masonry bằng CSS columns, không dùng thư viện JS: ảnh tour tỉ lệ khác nhau và
columns cho kết quả tương đương mà không tốn JavaScript.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Pipeline video

**Files:**
- Create: `scripts/build-video.ts`

**Interfaces:**
- Consumes: `ffmpeg` trên PATH
- Produces: file trong `public/media/video/`, in ra khối JSON để dán vào content

**Điều kiện tiên quyết:** `ffmpeg` phải có trên PATH. Trên Windows: `winget install Gyan.FFmpeg`, mở lại terminal, kiểm tra bằng `ffmpeg -version`.

- [ ] **Step 1: Viết script**

Tạo `scripts/build-video.ts`:

```ts
/**
 * Encode video cho web từ file gốc trong assets-src/video/.
 *
 * Sinh 3 thứ cho mỗi video:
 *   <tên>.mp4         H.264, encode thường — dùng cho hero autoplay loop
 *   <tên>.webm        VP9, nhẹ hơn — trình duyệt hỗ trợ sẽ ưu tiên
 *   <tên>-scrub.mp4   H.264 với -g 1 (mọi frame là keyframe) — dùng cho scroll scrub
 *
 * Vì sao cần bản scrub riêng: video thường đặt keyframe cách nhau 2–5 giây. Khi
 * gán currentTime tới vị trí bất kỳ, trình duyệt phải giải mã lại từ keyframe
 * gần nhất, gây giật rõ rệt. -g 1 loại bỏ hoàn toàn việc đó, đổi lại file phồng
 * lên nhiều lần — nên bản scrub bị giới hạn 6 giây và 1280px.
 *
 * Chạy: pnpm video
 */
import { execFile } from 'node:child_process'
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const SRC_DIR = path.join(process.cwd(), 'assets-src', 'video')
const OUT_DIR = path.join(process.cwd(), 'public', 'media', 'video')
const SCRUB_MAX_BYTES = 3 * 1024 * 1024
const SCRUB_MAX_SECONDS = 6

async function probeDuration(file: string): Promise<number> {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ])
  return Number.parseFloat(stdout.trim())
}

async function encode(file: string) {
  const name = path.basename(file).replace(/\.[^.]+$/, '')
  const out = (suffix: string) => path.join(OUT_DIR, `${name}${suffix}`)

  // Bản mp4 thường: hero autoplay loop.
  await run('ffmpeg', [
    '-y', '-i', file, '-an',
    '-vf', 'scale=1920:-2',
    '-c:v', 'libx264', '-crf', '24', '-preset', 'slow',
    '-movflags', '+faststart',
    out('.mp4'),
  ])

  // Bản webm VP9: nhẹ hơn mp4 khoảng 30% ở cùng chất lượng.
  await run('ffmpeg', [
    '-y', '-i', file, '-an',
    '-vf', 'scale=1920:-2',
    '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1',
    out('.webm'),
  ])

  // Bản scrub: cắt 6 giây đầu, hạ xuống 1280px, mọi frame là keyframe.
  await run('ffmpeg', [
    '-y', '-i', file, '-an',
    '-t', String(SCRUB_MAX_SECONDS),
    '-vf', 'scale=1280:-2,fps=30',
    '-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
    '-g', '1', '-keyint_min', '1', '-sc_threshold', '0',
    '-movflags', '+faststart',
    out('-scrub.mp4'),
  ])

  const scrubSize = (await stat(out('-scrub.mp4'))).size
  const duration = await probeDuration(out('-scrub.mp4'))

  if (scrubSize > SCRUB_MAX_BYTES) {
    console.warn(
      `⚠ ${name}-scrub.mp4 nặng ${(scrubSize / 1024 / 1024).toFixed(1)}MB, vượt ngưỡng 3MB.\n` +
        '  Rút ngắn video gốc, hoặc tăng -crf lên 30, hoặc hạ scale xuống 960.',
    )
  }

  console.log(`✓ ${name} — scrub ${(scrubSize / 1024 / 1024).toFixed(1)}MB, ${duration.toFixed(1)}s`)

  return {
    kind: 'video',
    mp4: `/media/video/${name}-scrub.mp4`,
    webm: `/media/video/${name}.webm`,
    poster: 'TODO: dán khối ảnh poster từ content/media-manifest.json',
    durationSec: Number(duration.toFixed(2)),
    scrubbable: true,
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const files = (await readdir(SRC_DIR)).filter((f) => /\.(mp4|mov|m4v|webm)$/i.test(f))

  if (files.length === 0) {
    console.log('Không tìm thấy video nào trong assets-src/video/. Bỏ qua.')
    return
  }

  const results = []
  for (const file of files) {
    results.push(await encode(path.join(SRC_DIR, file)))
  }

  console.log('\nDán khối dưới đây vào content JSON (nhớ thay poster):')
  console.log(JSON.stringify(results, null, 2))
}

main().catch((error) => {
  console.error('Encode thất bại. Kiểm tra ffmpeg đã có trên PATH chưa: ffmpeg -version')
  console.error(error)
  process.exit(1)
})
```

- [ ] **Step 2: Kiểm chứng bằng video thử**

Tạo một video thử 10 giây nếu chưa có video thật:

```bash
mkdir -p assets-src/video
ffmpeg -y -f lavfi -i "testsrc=size=1920x1080:rate=30:duration=10" assets-src/video/thu-nghiem.mp4
pnpm video
```

Expected: sinh 3 file trong `public/media/video/`; log in ra dung lượng bản scrub và cảnh báo nếu vượt 3MB.

- [ ] **Step 3: Đóng nợ tồn đọng từ Task 6 — promise metadata không settle khi huỷ**

Task 6 để lại một lỗi **chỉ kích hoạt được khi có video thật**, tức là đúng từ task này trở đi. Trong `src/components/home/HeroCinematic.tsx`, hàm `waitForMetadata()` dùng `AbortController` để gỡ listener khi effect bị huỷ, nhưng không hề resolve hay reject promise. Hệ quả: nếu người dùng rời trang trong lúc metadata video chưa tải xong, `await waitForMetadata()` không bao giờ trả về — `setup()` treo vĩnh viễn tại đó, và dòng `if (cancelled) return` ngay sau nó không bao giờ chạy.

Sửa bằng cách buộc promise kết thúc theo tín hiệu abort:

```ts
      const waitForMetadata = () =>
        videoEl.readyState >= 1
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const signal = metadataAbort.signal
              if (signal.aborted) return resolve()
              videoEl.addEventListener('loadedmetadata', () => resolve(), { once: true, signal })
              // Huỷ effect cũng phải kết thúc promise, nếu không setup() treo mãi
              // và dòng kiểm tra `cancelled` ngay sau await thành code chết.
              signal.addEventListener('abort', () => resolve(), { once: true })
            })
```

Resolve (không reject) để không sinh unhandled rejection; `if (cancelled) return` ngay sau `await` sẽ lo phần dừng đúng cách.

Kiểm chứng: `pnpm build` và `pnpm lint` vẫn sạch.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: script encode video — mp4, webm VP9, và bản scrub keyframe dày

Bản scrub encode -g 1 để tua tới vị trí bất kỳ không phải giải mã lại từ
keyframe gần nhất (nguyên nhân chính gây giật khi scroll-scrub video). Đổi lại
file phồng, nên giới hạn 6 giây/1280px và cảnh báo khi vượt 3MB.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Trang liên hệ và gửi email

**Files:**
- Create: `src/app/[locale]/lien-he/page.tsx`, `src/components/contact/ContactForm.tsx`, `src/app/api/contact/route.ts`, `src/lib/contact/validate.ts`
- Modify: `.env.example`
- Test: `src/lib/contact/__tests__/validate.test.ts`

**Interfaces:**
- Consumes: `getTours()`, `messages.contact`
- Produces: `validateContactInput(input: unknown): { ok: true; data: ContactInput } | { ok: false; error: string }`, `POST /api/contact`

- [ ] **Step 1: Viết test cho validate**

Tạo `src/lib/contact/__tests__/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { validateContactInput } from '../validate'

const valid = { name: 'Nguyễn Văn A', phone: '0912345678', tourSlug: 'mau-ha-giang', note: '', website: '' }

describe('validateContactInput', () => {
  it('chấp nhận yêu cầu hợp lệ', () => {
    expect(validateContactInput(valid).ok).toBe(true)
  })

  it('chấp nhận số điện thoại có dạng +84', () => {
    expect(validateContactInput({ ...valid, phone: '+84912345678' }).ok).toBe(true)
  })

  it('chấp nhận số điện thoại có khoảng trắng và dấu chấm', () => {
    expect(validateContactInput({ ...valid, phone: '091 234 5678' }).ok).toBe(true)
  })

  it('từ chối số điện thoại quá ngắn', () => {
    expect(validateContactInput({ ...valid, phone: '0912' }).ok).toBe(false)
  })

  it('từ chối tên rỗng', () => {
    expect(validateContactInput({ ...valid, name: '  ' }).ok).toBe(false)
  })

  it('từ chối khi trường honeypot có nội dung — đó là bot', () => {
    expect(validateContactInput({ ...valid, website: 'http://spam' }).ok).toBe(false)
  })

  it('từ chối ghi chú dài bất thường', () => {
    expect(validateContactInput({ ...valid, note: 'x'.repeat(3000) }).ok).toBe(false)
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm test src/lib/contact`
Expected: FAIL — `Cannot find module '../validate'`

- [ ] **Step 3: Viết validate**

Tạo `src/lib/contact/validate.ts`:

```ts
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  // Số Việt Nam: cho phép +84 hoặc 0 đầu, và dấu phân cách người dùng hay gõ.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.\-()]/g, ''))
    .refine((v) => /^(\+84|0)\d{8,10}$/.test(v), 'Số điện thoại không hợp lệ'),
  tourSlug: z.string().max(200).optional().or(z.literal('')),
  note: z.string().max(2000).optional().or(z.literal('')),
  // Honeypot: người thật không bao giờ điền trường bị ẩn này.
  website: z.string().max(0, 'bot'),
})

export type ContactInput = z.infer<typeof contactSchema>

export function validateContactInput(
  input: unknown,
): { ok: true; data: ContactInput } | { ok: false; error: string } {
  const result = contactSchema.safeParse(input)
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }
  }
  return { ok: true, data: result.data }
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm test src/lib/contact`
Expected: PASS 7 test

- [ ] **Step 5: Viết Route Handler**

```bash
pnpm add resend
```

Tạo `src/app/api/contact/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { validateContactInput } from '@/lib/contact/validate'

// Rate limit đơn giản trong bộ nhớ. Đủ để chặn spam thô; instance serverless bị
// tái tạo nên đây không phải hàng rào chắc chắn, chỉ là lớp đầu tiên.
const recentRequests = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 3

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (recentRequests.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (timestamps.length >= MAX_PER_WINDOW) return true
  timestamps.push(now)
  recentRequests.set(ip, timestamps)
  return false
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Quá nhiều yêu cầu' }, { status: 429 })
  }

  const result = validateContactInput(await request.json().catch(() => null))
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_EMAIL_TO
  const from = process.env.CONTACT_EMAIL_FROM
  if (!apiKey || !to || !from) {
    console.error('Thiếu biến môi trường RESEND_API_KEY / CONTACT_EMAIL_TO / CONTACT_EMAIL_FROM')
    return NextResponse.json({ error: 'Cấu hình email chưa sẵn sàng' }, { status: 500 })
  }

  const { name, phone, tourSlug, note } = result.data

  try {
    await new Resend(apiKey).emails.send({
      from,
      to,
      subject: `Yêu cầu đặt tour: ${name}`,
      text: [
        `Họ tên: ${name}`,
        `Điện thoại: ${phone}`,
        `Tour quan tâm: ${tourSlug || '(không chọn)'}`,
        `Ghi chú: ${note || '(không có)'}`,
      ].join('\n'),
    })
  } catch (error) {
    console.error('Gửi email thất bại', error)
    return NextResponse.json({ error: 'Không gửi được' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
```

Thêm vào `.env.example`:

```
RESEND_API_KEY=
CONTACT_EMAIL_TO=
CONTACT_EMAIL_FROM=
NEXT_PUBLIC_SITE_URL=https://example.com
```

- [ ] **Step 6: Viết ContactForm**

Tạo `src/components/contact/ContactForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

type Status = 'idle' | 'sending' | 'success' | 'error'

export function ContactForm({ tours }: { tours: { slug: string; label: string }[] }) {
  const t = useTranslations('contact')
  const params = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')

    // Giữ tham chiếu form TRƯỚC khi await: React tái sử dụng sự kiện tổng hợp,
    // sau await thì event.currentTarget đã là null và .reset() sẽ ném lỗi.
    const formEl = event.currentTarget
    const form = new FormData(formEl)

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form)),
    }).catch(() => null)

    if (response?.ok) {
      setStatus('success')
      setMessage(t('success'))
      formEl.reset()
    } else {
      setStatus('error')
      setMessage(t('error'))
    }
  }

  const inputClass =
    'w-full rounded-md border border-ink-700 bg-ink-900 px-4 py-3 outline-none focus:border-sand-400'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-ink-500">{t('name')}</span>
        <input name="name" required className={`mt-1 ${inputClass}`} />
      </label>

      <label className="block">
        <span className="text-sm text-ink-500">{t('phone')}</span>
        <input name="phone" type="tel" required inputMode="tel" className={`mt-1 ${inputClass}`} />
      </label>

      <label className="block">
        <span className="text-sm text-ink-500">{t('tour')}</span>
        <select
          name="tourSlug"
          defaultValue={params.get('tour') ?? ''}
          className={`mt-1 ${inputClass}`}
        >
          <option value="">—</option>
          {tours.map((tour) => (
            <option key={tour.slug} value={tour.slug}>
              {tour.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm text-ink-500">{t('note')}</span>
        <textarea name="note" rows={4} className={`mt-1 ${inputClass}`} />
      </label>

      {/* Honeypot: ẩn khỏi người dùng và khỏi trình đọc màn hình, bot vẫn điền. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0"
      />

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-full bg-clay-500 px-8 py-3 font-medium disabled:opacity-60"
      >
        {status === 'sending' ? t('sending') : t('submit')}
      </button>

      {message && (
        <p role="status" className={status === 'error' ? 'text-clay-500' : 'text-sand-400'}>
          {message}
        </p>
      )}
    </form>
  )
}
```

- [ ] **Step 7: Viết trang liên hệ**

Tạo `src/app/[locale]/lien-he/page.tsx`:

```tsx
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getTours } from '@/lib/content'
import { ContactForm } from '@/components/contact/ContactForm'
import type { Locale } from '@/i18n/routing'

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')
  const tours = (await getTours()).map((tour) => ({
    slug: tour.slug,
    label: tour.title[locale] ?? tour.title.vi,
  }))

  return (
    <main className="mx-auto max-w-xl px-6 pb-(--spacing-section) pt-40">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl">{t('title')}</h1>
      {/* useSearchParams cần Suspense để trang vẫn sinh tĩnh được. */}
      <Suspense>
        <div className="mt-10">
          <ContactForm tours={tours} />
        </div>
      </Suspense>
    </main>
  )
}
```

- [ ] **Step 8: Xác minh và commit**

`pnpm test && pnpm build`. Không có `RESEND_API_KEY` thì form trả lỗi 500 — đúng như thiết kế.

```bash
git add -A
git commit -m "feat: trang liên hệ, validate số điện thoại VN, gửi email qua Resend

Honeypot + rate limit theo IP chặn spam thô. Validate chuẩn hoá số điện thoại
trước khi kiểm tra để người dùng gõ '091 234 5678' vẫn được chấp nhận.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: SEO — metadata, sitemap, robots, dữ liệu có cấu trúc

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/tour/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getTourSlugs()`, `getHomeContent()`, `NEXT_PUBLIC_SITE_URL`
- Produces: `/sitemap.xml`, `/robots.txt`, JSON-LD trên trang tour

- [ ] **Step 1: Viết sitemap**

Tạo `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { getTourSlugs } from '@/lib/content'
import { routing } from '@/i18n/routing'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getTourSlugs()

  const staticPaths = ['', '/lien-he']
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        priority: path === '' ? 1 : 0.6,
      })
    }
    for (const slug of slugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/tour/${slug}`,
        lastModified: new Date(),
        priority: 0.8,
      })
    }
  }

  return entries
}
```

- [ ] **Step 2: Viết robots**

Tạo `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: Thêm metadataBase và JSON-LD**

Trong `src/app/[locale]/layout.tsx`, đổi `metadata` thành:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  // Metadata tĩnh không gọi được useTranslations, nên tên thương hiệu buộc phải
  // viết thẳng ở đây. Nếu đổi tên, nhớ đổi cả messages/vi.json khoá brand.name.
  title: { default: 'RosaTravel', template: '%s | RosaTravel' },
  description: 'Những hành trình được chọn lọc.',
}
```

Trong `src/app/[locale]/tour/[slug]/page.tsx`, thêm JSON-LD vào cuối `<main>`:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: tour.title[locale] ?? tour.title.vi,
      description: tour.summary[locale] ?? tour.summary.vi,
      touristType: 'Leisure',
      itinerary: tour.itinerary.map((day) => ({
        '@type': 'Place',
        name: day.title[locale] ?? day.title.vi,
      })),
      offers: {
        '@type': 'Offer',
        price: tour.priceFrom,
        priceCurrency: tour.currency,
      },
    }),
  }}
/>
```

`TouristTrip` là schema.org type đúng cho tour du lịch, và `offers.price` giúp Google hiển thị giá trong kết quả tìm kiếm.

- [ ] **Step 4: Xác minh và commit**

`pnpm build`, mở `/sitemap.xml` và `/robots.txt` ở dev. Kiểm tra JSON-LD bằng công cụ Rich Results Test của Google sau khi deploy.

```bash
git add -A
git commit -m "feat: SEO — sitemap, robots, metadataBase, JSON-LD TouristTrip

JSON-LD dùng type TouristTrip kèm offers.price để Google hiển thị giá trong
kết quả tìm kiếm.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Nghiệm thu hiệu năng và deploy

Task này không viết tính năng mới. Nó chứng minh mọi ngưỡng ở spec đã đạt.

**Files:**
- Create: `docs/nghiem-thu-hieu-nang.md`
- Modify: bất kỳ file nào cần sửa để đạt ngưỡng

**Điều kiện tiên quyết:** `chrome-devtools` MCP đã cài (`claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest`).

- [ ] **Step 1: Build production và chạy local**

```bash
pnpm build
pnpm start
```

Ghi lại kích thước bundle từ output của `next build`. Ngưỡng: First Load JS của route `/[locale]` dưới 200 KB.

- [ ] **Step 2: Đo Lighthouse mobile**

Dùng chrome-devtools MCP mở `http://localhost:3000/vi`, chạy Lighthouse ở chế độ mobile. Ghi lại LCP, CLS, INP, điểm Performance.

Ngưỡng: LCP < 2.5s, CLS < 0.1, INP < 200ms, Performance ≥ 90.

- [ ] **Step 3: Đo FPS trên từng cinematic beat**

Với mỗi beat (hero scrub, hành trình cuộn ngang, parallax lịch trình): bắt đầu performance trace, cuộn qua toàn bộ section, dừng trace, đọc số frame bị rớt.

Ngưỡng: ≥ 55fps trung bình trong lúc cuộn.

Nếu không đạt, kiểm tra theo thứ tự:
1. Có thuộc tính nào ngoài `transform`/`opacity` đang được animate không?
2. Ảnh đang tải có đúng kích thước không, hay `sizes` sai làm tải bản 2400px trên mobile?
3. Có bao nhiêu ScrollTrigger đang sống cùng lúc? Trigger của trang trước có bị kill khi chuyển trang không?
4. Bản scrub video có đúng là bản `-scrub.mp4` không, hay đang dùng nhầm bản thường?

- [ ] **Step 4: Chụp màn hình các breakpoint**

Chụp `/vi` và `/vi/tour/mau-ha-giang` ở bề rộng 390, 768, 1440, 1920. Kiểm tra không có tràn ngang, không vỡ chữ tiếng Việt có dấu.

- [ ] **Step 5: Ghi lại kết quả**

Tạo `docs/nghiem-thu-hieu-nang.md` với bảng: chỉ số, ngưỡng, số đo thực tế, đạt/không đạt, ngày đo, thiết bị/điều kiện đo. Đây là bằng chứng, không phải lời tuyên bố.

- [ ] **Step 6: Deploy Vercel**

```bash
pnpm dlx vercel@latest link
pnpm dlx vercel@latest env add RESEND_API_KEY production
pnpm dlx vercel@latest env add CONTACT_EMAIL_TO production
pnpm dlx vercel@latest env add CONTACT_EMAIL_FROM production
pnpm dlx vercel@latest env add NEXT_PUBLIC_SITE_URL production
pnpm dlx vercel@latest --prod
```

Lưu ý: `public/media/` nằm trong `.gitignore` nên **không** được đẩy lên Git. Có hai cách xử lý, chọn một và ghi lại quyết định:
- **Chạy `pnpm media && pnpm video` trong build command của Vercel** — cần commit `assets-src/`, khiến repo nặng.
- **Bỏ `public/media` khỏi `.gitignore` và commit ảnh đã tối ưu** — repo nặng vừa phải, build nhanh. Khuyến nghị cách này: ảnh AVIF đã nén nhỏ hơn nhiều lần ảnh gốc.

- [ ] **Step 7: Đo lại trên production**

Lặp Step 2 và 3 với URL production. Số đo trên Vercel mới là số thật — local không có độ trễ mạng và CDN.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "docs: kết quả nghiệm thu hiệu năng GĐ1

Số đo thực tế cho từng ngưỡng trong spec, đo trên production Vercel.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Kiểm tra sau khi hoàn thành GĐ1

- [ ] Mọi ngưỡng ở Task 15 đạt, có số đo ghi lại
- [ ] `grep -rn "from './fs'" src/components src/app` không trả về kết quả nào — không component nào vòng qua content interface
- [ ] `grep -rn "duration:\s*[0-9]" src/components` chỉ trả về các dòng dùng token, không có số hard-code
- [ ] Nội dung mẫu (`mau-*.json`, số điện thoại `0900000000`, email `example.com`) đã được thay bằng dữ liệu thật
- [ ] Mọi `alt` còn chuỗi `TODO` đã được điền
- [ ] `pnpm test` PASS toàn bộ
