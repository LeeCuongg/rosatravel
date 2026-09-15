import { describe, expect, it } from 'vitest'

import { isValidRevalidateAuth, revalidateToken } from './revalidate-token'

describe('revalidate token', () => {
  const secret = 'bi-mat-thu'

  it('không để lộ khóa gốc và cố định theo khóa', () => {
    const token = revalidateToken(secret)
    expect(token).not.toContain(secret)
    expect(token).toBe(revalidateToken(secret))
    expect(token).not.toBe(revalidateToken('khoa-khac'))
  })

  it('chỉ nhận đúng Bearer token', () => {
    const token = revalidateToken(secret)
    expect(isValidRevalidateAuth(`Bearer ${token}`, secret)).toBe(true)
    expect(isValidRevalidateAuth(`Bearer ${revalidateToken('khoa-khac')}`, secret)).toBe(false)
    expect(isValidRevalidateAuth(`Bearer ${secret}`, secret)).toBe(false)
    expect(isValidRevalidateAuth(token, secret)).toBe(false)
    expect(isValidRevalidateAuth(null, secret)).toBe(false)
    expect(isValidRevalidateAuth(`Bearer ${token}`, undefined)).toBe(false)
  })
})
