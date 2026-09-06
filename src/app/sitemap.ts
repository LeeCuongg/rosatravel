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
