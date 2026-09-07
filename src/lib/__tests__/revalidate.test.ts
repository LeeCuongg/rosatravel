import { beforeEach, describe, expect, it, vi } from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }))

const { revalidateMoiTrangCoLocale, revalidatePathAnToan } = await import('../revalidate')

beforeEach(() => {
  revalidatePath.mockReset()
})

describe('revalidateMoiTrangCoLocale', () => {
  it('gọi revalidatePath đúng mẫu route "/[locale]" với phạm vi layout', () => {
    // Đây là toàn bộ nội dung của bản sửa, và nó dễ bị "dọn dẹp" hỏng: '/[locale]'
    // trông như một chỗ ai đó quên thay biến. Đã kiểm trên bản build thật
    // (next 15.5.25, pnpm start):
    //   revalidatePath('/vi')              -> chỉ trang chủ được làm mới
    //   revalidatePath('/vi', 'layout')    -> KHÔNG trang nào được làm mới
    //   revalidatePath('/[locale]','layout') -> trang chủ + trang tour + /lien-he
    // Lý do ở implicit-tags.js: tập tag của một trang dựng từ TÊN ROUTE.
    revalidateMoiTrangCoLocale()
    expect(revalidatePath).toHaveBeenCalledTimes(1)
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]', 'layout')
  })
})

describe('revalidatePathAnToan', () => {
  it('nuốt đúng lỗi "chạy ngoài request Next.js"', () => {
    revalidatePath.mockImplementation(() => {
      throw new Error('Invariant: static generation store missing in revalidatePath /vi')
    })
    expect(() => revalidatePathAnToan('/vi')).not.toThrow()
  })

  it('lỗi khác được bọc thành thông báo tiếng Việt mà admin đọc được', () => {
    // Một `new Error(...)` thường ở đây sẽ bị Payload thay bằng "Something went
    // wrong." (routeError.js -> isErrorPublic). Đã kiểm bằng cách ném lỗi giả ở
    // hook trên bản build thật. Nên lỗi bắt buộc phải mang isPublic = true.
    revalidatePath.mockImplementation(() => {
      throw new Error('Cache handler exploded')
    })

    let bat: unknown
    try {
      revalidatePathAnToan('/[locale]', 'layout')
    } catch (error) {
      bat = error
    }

    const loi = bat as { message?: string; isPublic?: boolean; status?: number; cause?: unknown }
    expect(loi.isPublic).toBe(true)
    expect(loi.message).toMatch(/Chưa lưu được/)
    // Phải nói rõ dữ liệu KHÔNG được ghi: hook chạy trước commitTransaction và
    // cụm Atlas có transaction, nên thao tác lưu bị huỷ hẳn.
    expect(loi.message).toMatch(/KHÔNG được ghi lại/)
    expect(loi.message).toContain('Cache handler exploded')
    // Lỗi gốc phải còn nguyên ở `cause` để lập trình viên lần được stack trace.
    expect((loi.cause as Error).message).toBe('Cache handler exploded')
  })
})
