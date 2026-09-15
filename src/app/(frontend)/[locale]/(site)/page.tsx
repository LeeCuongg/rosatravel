import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { toImage } from '@/lib/data/mappers'
import { getHome, getSiteSettings } from '@/lib/data/queries'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const home = await getHome(locale)
  const image = toImage(home.seo?.image, 'hero')

  return {
    ...(home.seo?.title ? { title: { absolute: home.seo.title } } : {}),
    ...(home.seo?.description ? { description: home.seo.description } : {}),
    ...(image ? { openGraph: { images: [{ url: image.url, alt: image.alt }] } } : {}),
    alternates: { canonical: '/' },
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const [home, settings, t] = await Promise.all([getHome(locale), getSiteSettings(locale), getTranslations()])
  const blocks = home.layout ?? []

  // Chưa cấu hình trang chủ trong admin: hiện trang "sắp ra mắt" thay vì trang trắng.
  if (!blocks.length) {
    return (
      <Container className="flex min-h-[60dvh] max-w-3xl flex-col items-start justify-center gap-6 py-16">
        <Logo />
        <p className="font-display text-caption font-medium tracking-[1px] text-body uppercase">{t('Home.eyebrow')}</p>
        <h1 className="font-display text-display-md font-semibold text-balance md:text-display-xl">{t('Home.title')}</h1>
        <p className="text-body-md text-body">{t('Home.description')}</p>
      </Container>
    )
  }

  return (
    <>
      <h1 className="sr-only">{settings.companyName || t('Metadata.title')}</h1>
      <RenderBlocks blocks={blocks} locale={locale} />
    </>
  )
}
