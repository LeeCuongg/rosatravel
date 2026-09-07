import type { MetadataRoute } from 'next'
import { getTourSlugs } from '@/lib/content'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getTourSlugs()

  const staticPaths = ['', '/lien-he']
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      // Không đặt lastModified: nó sẽ bằng thời điểm build cho MỌI trang ở MỌI
      // lần deploy, tức là báo "vừa sửa" kể cả khi nội dung không đổi. Công cụ
      // tìm kiếm hạ trọng số những lastmod không đáng tin, nên khai sai còn tệ
      // hơn không khai. Muốn dùng đúng thì phải lấy từ thời điểm sửa thật của
      // nội dung (mtime file, hoặc trường updatedAt trong schema tour).
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        priority: path === '' ? 1 : 0.6,
      })
    }
    for (const slug of slugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/tour/${slug}`,
        priority: 0.8,
      })
    }
  }

  return entries
}
