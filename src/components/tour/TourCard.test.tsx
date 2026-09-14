import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithIntl } from '@/test/render'
import type { TourSummary } from '@/types/content'

import { TourCard } from './TourCard'

const tour: TourSummary = {
  id: '1',
  slug: 'ha-giang',
  title: 'Tour Hà Giang 3 ngày 2 đêm',
  coverImage: { url: '/ui-kit/tour-1.jpg', alt: 'Núi' },
  durationDays: 3,
  durationNights: 2,
  departureFrom: 'Hà Nội',
  price: 3180000,
  originalPrice: 3490000,
  rating: { average: 4.9, count: 128 },
  bookedCount: 540,
  badges: ['HOT'],
}

describe('TourCard', () => {
  it('chỉ có một link, trỏ tới trang tour và mang tên tour', () => {
    renderWithIntl(<TourCard tour={tour} />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('/tour/ha-giang')
    expect(links[0].textContent).toBe(tour.title)
  })

  it('hiện giá bán, giá gốc gạch ngang, thời lượng và điểm khởi hành', () => {
    renderWithIntl(<TourCard tour={tour} />)

    expect(screen.getByText('3.180.000đ')).toBeTruthy()
    expect(screen.getByText('3.490.000đ').tagName).toBe('S')
    expect(screen.getByText('3 ngày 2 đêm')).toBeTruthy()
    expect(screen.getByText('Khởi hành từ Hà Nội')).toBeTruthy()
    expect(screen.getByText('HOT')).toBeTruthy()
  })

  it('không hiện giá gạch ngang khi giá gốc không lớn hơn giá bán', () => {
    const { container } = renderWithIntl(<TourCard tour={{ ...tour, originalPrice: 3000000 }} />)
    expect(container.querySelector('s')).toBeNull()
  })

  it('không có đánh giá thì không hiện dòng đánh giá', () => {
    renderWithIntl(<TourCard tour={{ ...tour, rating: null }} />)
    expect(screen.queryByText(/đã đặt chỗ/)).toBeNull()
  })
})
