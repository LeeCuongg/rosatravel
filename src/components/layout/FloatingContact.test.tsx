import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithIntl } from '@/test/render'

import { FloatingContact } from './FloatingContact'

function hrefs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'))
}

describe('FloatingContact', () => {
  it('chỉ hiện các kênh đã cấu hình, Zalo nhận số điện thoại', () => {
    const { container } = renderWithIntl(
      <FloatingContact contact={{ zalo: '0973122807', instagram: 'https://instagram.com/rosa' }} bookingHref="/lien-he" />,
    )

    const links = hrefs(container)
    expect(links).toContain('https://zalo.me/0973122807')
    expect(links).toContain('https://instagram.com/rosa')
    expect(links.some((href) => href?.includes('facebook'))).toBe(false)
  })

  it('có hotline thì có nút gọi, không có thì ẩn', () => {
    const { container, unmount } = renderWithIntl(
      <FloatingContact contact={{ hotline: '0973122807' }} bookingHref="/lien-he" />,
    )
    expect(hrefs(container)).toContain('tel:+84973122807')
    unmount()

    renderWithIntl(<FloatingContact contact={{}} bookingHref="/lien-he" />)
    expect(screen.queryByRole('link', { name: 'Gọi' })).toBeNull()
  })

  it('luôn có nút Đặt tour', () => {
    renderWithIntl(<FloatingContact contact={{}} bookingHref="/lien-he" />)
    expect(screen.getByRole('link', { name: 'Đặt tour' }).getAttribute('href')).toBe('/lien-he')
  })

  it('chỉ có Zalo thì không có nút "Thêm"', () => {
    renderWithIntl(<FloatingContact contact={{ zalo: '0973122807' }} bookingHref="/lien-he" />)
    expect(screen.queryByRole('button', { name: 'Thêm' })).toBeNull()
  })

  it('nút nổi desktop mở/đóng danh sách kênh, Esc để đóng', async () => {
    const user = userEvent.setup()
    renderWithIntl(<FloatingContact contact={{ zalo: '0973122807' }} bookingHref="/lien-he" />)

    const toggle = screen.getByRole('button', { name: 'Mở các kênh liên hệ' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.getAttribute('aria-label')).toBe('Đóng các kênh liên hệ')

    await user.keyboard('{Escape}')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('không có kênh nào thì không có nút nổi desktop', () => {
    renderWithIntl(<FloatingContact contact={{ hotline: '0973122807' }} bookingHref="/lien-he" />)
    expect(screen.queryByRole('button', { name: 'Mở các kênh liên hệ' })).toBeNull()
  })
})
