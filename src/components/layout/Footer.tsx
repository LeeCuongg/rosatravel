import { Mail, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { BrandIcon } from '@/components/ui/BrandIcon'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { Link } from '@/i18n/navigation'
import { buildChannelLinks, hotlineHref } from '@/lib/contact'
import type { ContactSettings, FooterColumn } from '@/types/content'

type FooterProps = {
  /** Global `footer` trong admin. */
  columns: FooterColumn[]
  contact: ContactSettings
  about?: string | null
  legalLines?: string[] | null
  copyright?: string | null
}

export function Footer({ columns, contact, about, legalLines, copyright }: FooterProps) {
  const t = useTranslations()
  const tel = hotlineHref(contact)
  const email = contact.email?.trim()
  const channels = buildChannelLinks(contact)

  return (
    <footer className="bg-ink text-canvas-soft">
      <Container className="grid gap-10 py-12 lg:grid-cols-12 lg:py-16">
        <div className="space-y-4 lg:col-span-4">
          <Logo variant="dark" />
          {about ? <p className="max-w-sm text-body-sm text-mute">{about}</p> : null}
          {legalLines?.length ? (
            <ul className="space-y-1 text-caption text-body-mid">
              {legalLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-4 font-display text-body-md font-semibold text-on-primary">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-mute underline-offset-4 transition-colors hover:text-on-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="space-y-5 lg:col-span-3">
          <h2 className="font-display text-body-md font-semibold text-on-primary">{t('Footer.contact')}</h2>
          <ul className="space-y-2 text-body-sm">
            {tel ? (
              <li>
                <a href={tel} className="inline-flex items-center gap-2 text-mute transition-colors hover:text-on-primary">
                  <Phone aria-hidden className="size-4" />
                  {contact.hotline}
                </a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 break-all text-mute transition-colors hover:text-on-primary"
                >
                  <Mail aria-hidden className="size-4 shrink-0" />
                  {email}
                </a>
              </li>
            ) : null}
          </ul>

          {channels.length ? (
            <div className="space-y-3">
              <p className="text-caption font-semibold tracking-[1px] text-body-mid uppercase">{t('Footer.follow')}</p>
              <ul className="flex flex-wrap gap-2">
                {channels.map((channel) => (
                  <li key={channel.key}>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t(`Contact.channels.${channel.key}`)}
                      className="flex size-10 items-center justify-center rounded-pill border border-mute/40 text-canvas-soft transition-colors duration-(--duration-fast) hover:border-primary hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <BrandIcon channel={channel.key} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Container>

      {copyright ? (
        <div className="border-t border-canvas-soft/10">
          <Container className="py-5 text-caption text-body-mid">{copyright}</Container>
        </div>
      ) : null}
    </footer>
  )
}
