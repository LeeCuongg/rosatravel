import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Fraunces, Inter } from 'next/font/google'
import { routing } from '@/i18n/routing'
import { MotionTierProvider } from '@/lib/motion/MotionTierProvider'
import { SmoothScroll } from '@/lib/motion/SmoothScroll'
import { getHomeContent } from '@/lib/content'
import { SITE_URL } from '@/lib/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'
import '../globals.css'

const sans = Inter({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * Fraunces thay Playfair Display cho MỌI tiêu đề.
 *
 * Vì sao đổi: Playfair là Didone thế kỷ 18 — đẹp nhưng đã thành mặc định của
 * mọi template du lịch, nên nó không còn nói lên điều gì. Fraunces là serif
 * "old-style biến dạng" có trục WONK, cho đúng chất tạp chí mà spotstravel.co
 * đạt được bằng font trả phí Kalice.
 *
 * `axes` PHẢI khai đủ ba trục phi mặc định. next/font chỉ nhúng trục nào được
 * liệt kê ở đây; thiếu chúng thì `font-variation-settings` trong globals.css
 * (bật WONK) không có tác dụng nào cả — chữ vẫn hiện, chỉ là hiện sai kiểu, và
 * không có lỗi nào báo ra.
 *
 * Không khai `weight`: đây là font biến thiên, để trống thì next/font nhúng
 * toàn dải và trục wght điều khiển được bằng CSS.
 */
const display = Fraunces({
  subsets: ['vietnamese', 'latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Metadata tĩnh không gọi được useTranslations, nên tên thương hiệu buộc phải
  // viết thẳng ở đây. Nếu đổi tên, nhớ đổi cả messages/vi.json khoá brand.name.
  title: { default: 'RosaTravel', template: '%s | RosaTravel' },
  description: 'Những hành trình được chọn lọc.',
}

/**
 * `modal` là KHE SONG SONG (parallel route) — thư mục src/app/[locale]/@modal.
 * Next tự truyền nó vào đây như một prop, cạnh `children`.
 *
 * Hầu như lúc nào nó cũng là null (@modal/default.tsx). Chỉ khi người đọc bấm
 * một liên kết tới /chuyen-di/<slug> TỪ TRONG SITE thì intercepting route mới
 * chặn điều hướng lại và vẽ bài đó vào khe này — trang phía dưới vẫn nguyên vẹn,
 * kể cả vị trí cuộn.
 *
 * Khe này nằm NGOÀI PageTransition có chủ đích. PageTransition làm mờ rồi hiện
 * lại `children` mỗi lần đổi đường dẫn; nếu lớp phủ nằm trong đó thì mở lớp phủ
 * sẽ kéo theo một nhịp nhấp nháy của toàn bộ trang nền — đúng thứ mà lớp phủ
 * sinh ra để tránh.
 */
export default async function LocaleLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode
  modal: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as never)) notFound()

  setRequestLocale(locale)
  const messages = await getMessages()
  const { contact } = await getHomeContent()

  return (
    <html lang={locale} className={`${sans.variable} ${display.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <MotionTierProvider>
            <SmoothScroll>
              <Header contact={contact} />
              <PageTransition>{children}</PageTransition>
              <Footer contact={contact} />
              {modal}
            </SmoothScroll>
          </MotionTierProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
