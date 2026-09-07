import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google'
import { routing } from '@/i18n/routing'
import { MotionTierProvider } from '@/lib/motion/MotionTierProvider'
import { SmoothScroll } from '@/lib/motion/SmoothScroll'
import { getHomeContent } from '@/lib/content'
import { SITE_URL } from '@/lib/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'
import '../globals.css'

const sans = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

const display = Playfair_Display({
  subsets: ['vietnamese', 'latin'],
  weight: ['400'],
  variable: '--font-playfair',
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
            </SmoothScroll>
          </MotionTierProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
