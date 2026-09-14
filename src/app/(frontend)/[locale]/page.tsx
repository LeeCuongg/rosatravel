import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Logo } from '@/components/ui/Logo'

type Props = {
  params: Promise<{ locale: string }>
}

// Trang tạm của giai đoạn 0: chỉ để kiểm tra font, token và logo trên bản preview.
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Home')

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 px-6 py-16">
      <Logo />
      <p className="font-display text-caption font-medium tracking-[1px] text-body uppercase">
        {t('eyebrow')}
      </p>
      <h1 className="font-display text-display-md font-semibold text-balance md:text-display-xl">
        {t('title')}
      </h1>
      <p className="text-body-md text-body">{t('description')}</p>
    </main>
  )
}
