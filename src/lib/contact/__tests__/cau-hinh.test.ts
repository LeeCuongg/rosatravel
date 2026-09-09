import { describe, expect, it } from 'vitest'
import { chonCauHinhEmail } from '../cau-hinh'

const DU = { apiKey: 're_env', emailTo: 'env@to.vn', emailFrom: 'env@from.vn' }

describe('chonCauHinhEmail', () => {
  it('dùng biến môi trường khi admin chưa đặt gì', () => {
    const ket = chonCauHinhEmail(null, DU)
    expect(ket).toEqual({ ok: true, data: DU })
  })

  it('ưu tiên giá trị trong admin hơn biến môi trường', () => {
    const ket = chonCauHinhEmail({ apiKey: 're_admin' }, DU)
    expect(ket.ok && ket.data.apiKey).toBe('re_admin')
  })

  it('trộn được từng trường một', () => {
    // Đổi hộp thư nhận trong admin nhưng vẫn dùng khoá API từ môi trường là
    // trường hợp bình thường, không phải ngoại lệ.
    const ket = chonCauHinhEmail({ emailTo: 'admin@to.vn' }, DU)
    expect(ket.ok && ket.data).toEqual({ ...DU, emailTo: 'admin@to.vn' })
  })

  it('coi chuỗi rỗng và khoảng trắng như chưa đặt', () => {
    // Payload lưu ô text để trống thành '' chứ không phải undefined. Không xử
    // lý riêng thì '' sẽ "thắng" biến môi trường và form ngừng gửi được ngay
    // khi ai đó mở global lên rồi bấm lưu mà không điền gì.
    const ket = chonCauHinhEmail({ apiKey: '', emailTo: '   ' }, DU)
    expect(ket).toEqual({ ok: true, data: DU })
  })

  it('nêu đích danh những trường còn thiếu', () => {
    const ket = chonCauHinhEmail(null, { emailTo: 'chi@co.mot' })
    expect(ket.ok).toBe(false)
    expect(!ket.ok && ket.thieu).toEqual(['apiKey', 'emailFrom'])
  })

  it('bỏ qua giá trị không phải chuỗi thay vì để lọt xuống Resend', () => {
    const ket = chonCauHinhEmail({ apiKey: 123, emailTo: null }, DU)
    expect(ket).toEqual({ ok: true, data: DU })
  })
})
