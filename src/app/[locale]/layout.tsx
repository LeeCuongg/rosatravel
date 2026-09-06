import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google'
import { routing } from '@/i18n/routing'
import { MotionTierProvider } from '@/lib/motion/MotionTierProvider'
import { SmoothScroll } from '@/lib/motion/SmoothScroll'
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
        <NextIntlClientProvider messages={messages}>
          <MotionTierProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </MotionTierProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
