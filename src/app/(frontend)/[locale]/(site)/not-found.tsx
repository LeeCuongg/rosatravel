import { getTranslations } from 'next-intl/server'

import { buttonClassName } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <Container className="flex min-h-[55dvh] max-w-3xl flex-col items-start justify-center gap-4 py-16">
      <p className="font-display text-caption font-medium tracking-[1px] text-primary uppercase">404</p>
      <h1 className="font-display text-display-md font-semibold text-ink md:text-display-lg">{t('title')}</h1>
      <p className="text-body-md text-body">{t('description')}</p>
      <Link href="/" className={buttonClassName({ className: 'mt-2' })}>
        {t('backHome')}
      </Link>
    </Container>
  )
}
