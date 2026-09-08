import type { MetadataRoute } from 'next'
import { getCaseStudySlugs, getLocationSlugs, getTourSlugs } from '@/lib/content'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, caseSlugs, locationSlugs] = await Promise.all([
    getTourSlugs(),
    getCaseStudySlugs(),
    getLocationSlugs(),
  ])

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
    // Chuyến đã đi xếp dưới tour: nó không bán được gì, nhiệm vụ của nó là
    // thuyết phục người đã vào site. Địa điểm xếp thấp nhất nhưng vẫn phải có
    // mặt — chúng là những trang duy nhất xếp hạng được cho truy vấn tên riêng
    // ("quán X ở Đồng Văn"), và đó là cửa vào tự nhiên nhất của site.
    for (const slug of caseSlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/chuyen-di/${slug}`,
        priority: 0.7,
      })
    }
    for (const slug of locationSlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/dia-diem/${slug}`,
        priority: 0.5,
      })
    }
  }

  return entries
}
