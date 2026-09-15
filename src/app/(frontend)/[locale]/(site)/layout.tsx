import { draftMode } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import { FloatingContact } from '@/components/layout/FloatingContact'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { DraftModeBar } from '@/components/preview/DraftModeBar'
import { LivePreviewListener } from '@/components/preview/LivePreviewListener'
import { toContactSettings, toFooterColumns, toNavItems } from '@/lib/data/mappers'
import { getFooter, getHeader, getSiteSettings } from '@/lib/data/queries'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

/** Khung chung của mọi trang public: menu, chân trang, nút liên hệ đều lấy từ admin. */
export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const [settings, header, footer, draft, t] = await Promise.all([
    getSiteSettings(locale),
    getHeader(locale),
    getFooter(locale),
    draftMode(),
    getTranslations('Common'),
  ])

  const contact = toContactSettings(settings)
  const bookingHref = settings.bookingPath || '/lien-he'

  return (
    <>
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-on-primary"
      >
        {t('skipToContent')}
      </a>
      {draft.isEnabled ? (
        <>
          <DraftModeBar />
          <LivePreviewListener />
        </>
      ) : null}
      <Header items={toNavItems(header, draft.isEnabled)} contact={contact} bookingHref={bookingHref} />
      <main id="noi-dung" className="min-h-[60dvh]">
        {children}
      </main>
      <Footer
        columns={toFooterColumns(footer)}
        contact={contact}
        about={settings.about}
        legalLines={settings.legalLines?.map((line) => line.text)}
        copyright={settings.copyright}
      />
      <FloatingContact contact={contact} bookingHref={bookingHref} />
    </>
  )
}
