/** Ô bẫy: ẩn với người dùng, bot tự điền. */
export const HONEYPOT_FIELD = 'company_website'
/** Mốc thời gian form hiện ra (điền bằng JavaScript phía trình duyệt). */
export const STARTED_AT_FIELD = 'startedAt'
/** Người thật không điền xong form nhanh hơn mức này. */
export const MIN_FILL_MS = 2500

export function isLikelyBot(formData: FormData, now = Date.now()): boolean {
  const honeypot = formData.get(HONEYPOT_FIELD)
  if (typeof honeypot === 'string' && honeypot.trim()) return true

  // Không có JavaScript thì không có mốc thời gian: không chặn để form vẫn dùng được.
  const startedAt = Number(formData.get(STARTED_AT_FIELD))
  return Number.isFinite(startedAt) && startedAt > 0 && now - startedAt < MIN_FILL_MS
}

/**
 * Giới hạn số lần gửi theo khóa (IP) trong bộ nhớ tiến trình. Trên Vercel mỗi
 * instance có bộ nhớ riêng nên đây chỉ là lớp chặn thô, đi kèm chống gửi trùng trong DB.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>()

  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
    const allowed = recent.length < limit
    if (allowed) recent.push(now)
    hits.set(key, recent)

    if (hits.size > 5000) {
      for (const [entry, times] of hits) {
        if (!times.some((time) => now - time < windowMs)) hits.delete(entry)
      }
    }
    return allowed
  }
}
