/**
 * Làm mới cache dữ liệu của site sau khi sửa dữ liệu bằng script.
 *
 *   pnpm exec tsx src/scripts/revalidate-site.ts                              (localhost)
 *   pnpm exec tsx src/scripts/revalidate-site.ts https://rosatravel.vercel.app
 *
 * Token tạo từ PAYLOAD_SECRET trong .env.local, phải trùng với PAYLOAD_SECRET của site đích.
 */
import { config } from 'dotenv'

import { revalidateToken } from '../lib/revalidate-token'

config({ path: ['.env.local', '.env'] })

const secret = process.env.PAYLOAD_SECRET
if (!secret) {
  console.error('Thiếu PAYLOAD_SECRET trong .env.local')
  process.exit(1)
}

const siteUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const response = await fetch(`${siteUrl}/next/revalidate`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${revalidateToken(secret)}` },
})
const body = await response.text()
console.log(`${siteUrl}: HTTP ${response.status} ${body}`)
process.exit(response.ok ? 0 : 1)
