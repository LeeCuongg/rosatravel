/**
 * Nguồn duy nhất cho URL gốc của site.
 *
 * Thứ tự ưu tiên: biến môi trường tự đặt → domain production Vercel tự cấp →
 * localhost (chỉ khi phát triển).
 *
 * Build production mà không có URL thật thì DỪNG HẲN: sitemap, robots và mọi
 * thẻ og: sẽ trỏ về localhost, site vẫn chạy nên không có gì báo động, nhưng
 * Search Console từ chối sitemap và mọi lần share Zalo/Facebook đều hỏng ảnh.
 * Build vỡ ồn ào rẻ hơn nhiều so với deploy sai âm thầm.
 */
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined

const resolved = process.env.NEXT_PUBLIC_SITE_URL ?? fromVercel

if (!resolved && process.env.NODE_ENV === 'production') {
  throw new Error(
    'NEXT_PUBLIC_SITE_URL chưa được đặt. Đặt nó trong Vercel Project Settings → Environment Variables trước khi deploy, nếu không sitemap và thẻ og: sẽ trỏ về localhost.',
  )
}

export const SITE_URL = (resolved ?? 'http://localhost:3000').replace(/\/$/, '')
