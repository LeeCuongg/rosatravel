/**
 * Chuẩn hóa chữ để tìm kiếm không phân biệt dấu, hoa thường, ký tự đặc biệt:
 * "Quảng Châu – HỒNG KÔNG!" → "quang chau hong kong".
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export const SEARCH_MIN_LENGTH = 2
export const SEARCH_MAX_LENGTH = 80

/** Ký tự bao quanh từng từ trong trường searchText, để tìm được theo đầu từ. */
const WORD_EDGE = '|'
const MAX_SEARCH_WORDS = 8

/** ["Tour Hồng Kông", "Hà Nội"] → "|tour|hong|kong|ha|noi|" (trống thì ""). */
export function toSearchText(values: (string | null | undefined)[]): string {
  const words = normalizeSearch(values.filter(Boolean).join(' '))
  return words ? `${WORD_EDGE}${words.split(' ').join(WORD_EDGE)}${WORD_EDGE}` : ''
}

/**
 * Từ khóa đã chuẩn hóa → các đoạn mà searchText phải chứa đủ. Mỗi từ phải là một từ
 * trọn vẹn, riêng từ cuối chỉ cần khớp phần đầu (khách đang gõ dở):
 * "phu quoc" → ["|phu|", "|quoc"]. Nhờ vậy "phu" không khớp nhầm "phục vụ".
 */
export function searchFragments(query: string): string[] {
  const words = [...new Set(normalizeSearch(query).split(' ').filter(Boolean))].slice(0, MAX_SEARCH_WORDS)
  return words.map((word, index) =>
    index === words.length - 1 ? `${WORD_EDGE}${word}` : `${WORD_EDGE}${word}${WORD_EDGE}`,
  )
}

/** Từ khóa khách gõ → chuỗi đã chuẩn hóa; quá ngắn thì null (không tìm). */
export function toSearchQuery(raw: string | null | undefined): string | null {
  const query = normalizeSearch((raw ?? '').slice(0, SEARCH_MAX_LENGTH))
  return query.length >= SEARCH_MIN_LENGTH ? query : null
}
