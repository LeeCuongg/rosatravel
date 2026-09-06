import { describe, expect, it } from 'vitest'
import { getTours, getTour, getTourSlugs, getHomeContent } from '../index'

describe('content adapter', () => {
  it('đọc được toàn bộ tour trong content/tours', async () => {
    const tours = await getTours()
    expect(tours.length).toBeGreaterThan(0)
  })

  it('mọi tour đọc ra đều đã qua validate schema', async () => {
    const tours = await getTours()
    for (const tour of tours) {
      expect(tour.itinerary.length).toBe(tour.durationDays)
      expect(tour.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('getTour trả về đúng tour theo slug', async () => {
    const slugs = await getTourSlugs()
    const tour = await getTour(slugs[0])
    expect(tour?.slug).toBe(slugs[0])
  })

  it('getTour trả về null khi slug không tồn tại thay vì ném lỗi', async () => {
    expect(await getTour('khong-ton-tai')).toBeNull()
  })

  it('getTourSlugs trả về slug khớp với file trong thư mục', async () => {
    const slugs = await getTourSlugs()
    const tours = await getTours()
    expect(slugs.sort()).toEqual(tours.map((t) => t.slug).sort())
  })

  it('getHomeContent trả về nội dung đã validate', async () => {
    const home = await getHomeContent()
    expect(home.featuredTourSlugs.length).toBeGreaterThan(0)
  })

  it('mọi slug trong featuredTourSlugs đều tồn tại thật', async () => {
    const home = await getHomeContent()
    const slugs = await getTourSlugs()
    for (const slug of home.featuredTourSlugs) {
      expect(slugs).toContain(slug)
    }
  })
})
