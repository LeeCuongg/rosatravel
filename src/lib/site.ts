/**
 * Nguồn duy nhất cho URL gốc của site. Ba nơi cần nó (metadataBase, sitemap,
 * robots) — viết lặp ba lần thì một chỗ đổi mà hai chỗ kia không đổi sẽ khiến
 * sitemap trỏ sang origin khác với canonical, một lỗi SEO im lặng.
 *
 * Cắt dấu gạch chéo cuối để `${SITE_URL}/vi` không thành `//vi` nếu biến môi
 * trường được đặt kèm dấu gạch chéo.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')
