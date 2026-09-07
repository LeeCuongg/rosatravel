import { beforeEach, describe, expect, it, vi } from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }))

const { Tours } = await import('../../collections/Tours')
const { Media } = await import('../../collections/Media')
const { Home } = await import('../../globals/Home')

/**
 * Vì sao có file này.
 *
 * revalidate.test.ts đã ghim hợp đồng của HÀM DÙNG CHUNG. Nhưng lỗi thật từng
 * xảy ra không nằm ở hàm đó — nó nằm ở chỗ collection `media` KHÔNG HỀ đăng ký
 * hook nào. Hàm đúng mà không ai gọi thì im lặng y hệt hàm sai, và `pnpm test`
 * lúc ấy vẫn xanh.
 *
 * Nên các test dưới đây không kiểm "hook có tồn tại không" — chúng GỌI hook
 * thật từ chính cấu hình được xuất ra, rồi kiểm xem revalidatePath có được
 * chạm tới không. Xoá một dòng trong khối `hooks:` là đỏ ngay.
 */

type HookLoose = (args: Record<string, unknown>) => unknown

function goiHook(danhSach: unknown, args: Record<string, unknown>): void {
  const hooks = danhSach as HookLoose[] | undefined
  expect(Array.isArray(hooks), 'khối hooks chưa được đăng ký').toBe(true)
  expect((hooks as HookLoose[]).length, 'khối hooks rỗng').toBeGreaterThan(0)
  for (const hook of hooks as HookLoose[]) hook(args)
}

const LAYOUT: [string, string] = ['/[locale]', 'layout']

/**
 * Chỉ hỏi "đường dẫn này có được làm mới không". Không ghim cả chữ ký lời gọi:
 * hàm bọc luôn truyền tham số thứ hai, nên sitemap tới nơi dưới dạng
 * ('/sitemap.xml', undefined). Ghim theo chữ ký sẽ đỏ khi ai đó đổi mặc định
 * của hàm bọc, dù hành vi không đổi chút nào.
 */
function daLamMoi(duongDan: string): boolean {
  return revalidatePath.mock.calls.some((call) => call[0] === duongDan)
}

beforeEach(() => {
  revalidatePath.mockReset()
})

describe('tour', () => {
  it('sửa tour làm mới mọi trang có locale', () => {
    goiHook(Tours.hooks?.afterChange, {
      doc: { slug: 'mau-ha-giang' },
      previousDoc: { slug: 'mau-ha-giang' },
      operation: 'update',
    })
    expect(revalidatePath).toHaveBeenCalledWith(...LAYOUT)
  })

  it('đổi slug làm mới cả sitemap, vì URL cũ đã chết', () => {
    goiHook(Tours.hooks?.afterChange, {
      doc: { slug: 'ha-giang-moi' },
      previousDoc: { slug: 'mau-ha-giang' },
      operation: 'update',
    })
    expect(revalidatePath).toHaveBeenCalledWith(...LAYOUT)
    expect(daLamMoi('/sitemap.xml')).toBe(true)
  })

  it('sửa nội dung mà không đổi slug thì KHÔNG đụng sitemap', () => {
    goiHook(Tours.hooks?.afterChange, {
      doc: { slug: 'mau-ha-giang' },
      previousDoc: { slug: 'mau-ha-giang' },
      operation: 'update',
    })
    expect(daLamMoi('/sitemap.xml')).toBe(false)
  })

  it('xoá tour làm mới cả trang lẫn sitemap', () => {
    goiHook(Tours.hooks?.afterDelete, { doc: { slug: 'mau-ha-giang' } })
    expect(revalidatePath).toHaveBeenCalledWith(...LAYOUT)
    expect(daLamMoi('/sitemap.xml')).toBe(true)
  })
})

describe('ảnh', () => {
  // Đây chính là lỗi mà file test này sinh ra để canh: media từng không có
  // hook nào, nên sửa alt hoặc thay ảnh không bao giờ tới được site đang chạy.
  it('sửa bản ghi ảnh làm mới mọi trang có locale', () => {
    goiHook(Media.hooks?.afterChange, { doc: { filename: 'hero.avif' } })
    expect(revalidatePath).toHaveBeenCalledWith(...LAYOUT)
  })

  it('xoá ảnh làm mới mọi trang có locale', () => {
    goiHook(Media.hooks?.afterDelete, { doc: { filename: 'hero.avif' } })
    expect(revalidatePath).toHaveBeenCalledWith(...LAYOUT)
  })
})

describe('trang chủ', () => {
  // contact (điện thoại, email, Zalo) đi qua layout nên hiện trên MỌI trang —
  // làm mới mỗi '/vi' là bỏ sót toàn bộ trang tour.
  it('sửa trang chủ làm mới mọi trang có locale', () => {
    goiHook(Home.hooks?.afterChange, { doc: {} })
    expect(revalidatePath).toHaveBeenCalledWith(...LAYOUT)
  })
})
