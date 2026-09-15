import { describe, expect, it } from 'vitest'

import type { Header, Media, Tour } from '@/payload-types'

import { toImage, toNavItems, toTourSummaries, toTourSummary, upcomingDepartures, visible } from './mappers'

const media: Media = {
  id: 'm1',
  alt: 'Ruộng bậc thang',
  url: '/api/media/file/goc.jpg',
  width: 3000,
  height: 2000,
  sizes: { card: { url: '/api/media/file/goc-960x640.jpg', width: 960, height: 640 } },
  updatedAt: '',
  createdAt: '',
}

function tour(overrides: Partial<Tour> = {}): Tour {
  return {
    id: 't1',
    title: 'Tour Hà Giang',
    slug: 'ha-giang',
    coverImage: media,
    durationDays: 3,
    durationNights: 2,
    departureFrom: 'Hà Nội',
    price: 3180000,
    updatedAt: '',
    createdAt: '',
    _status: 'published',
    ...overrides,
  } as Tour
}

describe('toImage', () => {
  it('ưu tiên kích thước được yêu cầu, không có thì dùng ảnh gốc', () => {
    expect(toImage(media, 'card')).toEqual({ url: '/api/media/file/goc-960x640.jpg', alt: 'Ruộng bậc thang', width: 960, height: 640 })
    expect(toImage(media, 'hero')?.url).toBe('/api/media/file/goc.jpg')
  })

  it('chưa populate (chỉ là id) thì null', () => {
    expect(toImage('m1')).toBeNull()
    expect(toImage(null)).toBeNull()
  })
})

describe('visible', () => {
  it('không xem nháp thì bỏ tài liệu nháp và id chưa populate', () => {
    const docs = [tour(), tour({ id: 't2', _status: 'draft' }), 't3']
    expect(visible(docs, false).map((d) => d.id)).toEqual(['t1'])
    expect(visible(docs, true).map((d) => d.id)).toEqual(['t1', 't2'])
  })
})

describe('toTourSummary', () => {
  it('lấy ảnh cỡ thẻ, chỉ số chỉ hiện khi đủ điểm và số lượt', () => {
    const summary = toTourSummary(
      tour({ stats: { ratingAverage: 4.8, ratingCount: 20, bookedCount: 100 }, badges: [{ text: 'HOT' }] }),
    )
    expect(summary?.coverImage.url).toBe('/api/media/file/goc-960x640.jpg')
    expect(summary?.rating).toEqual({ average: 4.8, count: 20 })
    expect(summary?.badges).toEqual(['HOT'])
    expect(toTourSummary(tour({ stats: { ratingAverage: 4.8 } }))?.rating).toBeNull()
  })

  it('thiếu ảnh bìa thì không hiện thẻ', () => {
    expect(toTourSummary(tour({ coverImage: 'm1' }))).toBeNull()
    expect(toTourSummaries([tour({ coverImage: 'm1' }), tour({ id: 't2' })], false)).toHaveLength(1)
  })
})

describe('toNavItems', () => {
  it('chỉ có menu xổ xuống khi được bật và có nội dung', () => {
    const header: Header = {
      id: 'h',
      navItems: [
        { label: 'Cẩm nang', href: '/cam-nang' },
        { label: 'Trong nước', href: '/danh-muc/trong-nuoc', hasMegaMenu: true, megaMenu: { groups: [] } },
        {
          label: 'Nước ngoài',
          href: '/danh-muc/nuoc-ngoai',
          hasMegaMenu: true,
          megaMenu: { groups: [{ title: 'Châu Á', links: [{ label: 'Nhật Bản', href: '/diem-den/nhat-ban' }] }] },
        },
      ],
    }

    const items = toNavItems(header)
    expect(items[0].megaMenu).toBeNull()
    expect(items[1].megaMenu).toBeNull()
    expect(items[2].megaMenu?.groups[0]).toEqual({
      title: 'Châu Á',
      href: null,
      links: [{ label: 'Nhật Bản', href: '/diem-den/nhat-ban' }],
    })
  })
})

describe('upcomingDepartures', () => {
  it('bỏ ngày đã qua, giữ hôm nay, sắp xếp từ sớm nhất', () => {
    const now = new Date('2026-09-15T08:00:00.000Z')
    const result = upcomingDepartures(
      [
        { date: '2026-10-01T12:00:00.000Z', status: 'available' },
        { date: '2026-09-10T12:00:00.000Z', status: 'available' },
        { date: '2026-09-15T12:00:00.000Z', status: 'limited' },
      ],
      now,
    )
    expect(result.map((d) => d.date)).toEqual(['2026-09-15T12:00:00.000Z', '2026-10-01T12:00:00.000Z'])
  })
})
