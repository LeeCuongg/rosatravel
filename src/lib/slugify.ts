/** "Tour Hà Giang 3 ngày 2 đêm" → "tour-ha-giang-3-ngay-2-dem" */
export function slugifyVi(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
