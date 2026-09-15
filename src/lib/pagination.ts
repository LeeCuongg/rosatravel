export type PageItem = number | 'gap'

/** Các nút trang cần hiện: trang đầu, cuối, trang hiện tại ±1, khoảng trống hiện "…". */
export function paginationRange(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const items: PageItem[] = []
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push('gap')
    items.push(page)
  })
  return items
}
