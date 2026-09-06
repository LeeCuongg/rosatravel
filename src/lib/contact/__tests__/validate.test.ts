import { describe, expect, it } from 'vitest'
import { validateContactInput } from '../validate'

const valid = { name: 'Nguyễn Văn A', phone: '0912345678', tourSlug: 'mau-ha-giang', note: '', website: '' }

describe('validateContactInput', () => {
  it('chấp nhận yêu cầu hợp lệ', () => {
    expect(validateContactInput(valid).ok).toBe(true)
  })

  it('chấp nhận số điện thoại có dạng +84', () => {
    expect(validateContactInput({ ...valid, phone: '+84912345678' }).ok).toBe(true)
  })

  it('chấp nhận số điện thoại có khoảng trắng và dấu chấm', () => {
    expect(validateContactInput({ ...valid, phone: '091 234 5678' }).ok).toBe(true)
  })

  it('từ chối số điện thoại quá ngắn', () => {
    expect(validateContactInput({ ...valid, phone: '0912' }).ok).toBe(false)
  })

  it('từ chối tên rỗng', () => {
    expect(validateContactInput({ ...valid, name: '  ' }).ok).toBe(false)
  })

  it('từ chối khi trường honeypot có nội dung — đó là bot', () => {
    expect(validateContactInput({ ...valid, website: 'http://spam' }).ok).toBe(false)
  })

  it('từ chối ghi chú dài bất thường', () => {
    expect(validateContactInput({ ...valid, note: 'x'.repeat(3000) }).ok).toBe(false)
  })
})
