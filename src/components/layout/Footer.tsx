import { useTranslations } from 'next-intl'
import type { HomeContent } from '@/lib/content'

export function Footer({ contact }: { contact: HomeContent['contact'] }) {
  const t = useTranslations('cta')

  return (
    <footer className="border-t border-ink-700 px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()}</p>
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
