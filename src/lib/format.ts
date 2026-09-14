const vndNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

/** 3180000 → "3.180.000đ" */
export function formatVnd(amount: number): string {
  return `${vndNumber.format(amount)}đ`
}

/** Phần trăm giảm, làm tròn xuống. `null` khi không có giá gốc hợp lệ lớn hơn giá bán. */
export function discountPercent(price: number, originalPrice?: number | null): number | null {
  if (!originalPrice || originalPrice <= price || price <= 0) {
    return null
  }
  return Math.floor(((originalPrice - price) / originalPrice) * 100)
}
