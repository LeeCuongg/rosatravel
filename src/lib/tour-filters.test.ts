import { describe, expect, it } from 'vitest'

import {
  departureMonthsOf,
  parseTourFilters,
  toFilterQuery,
  tourFilterWhere,
  upcomingMonths,
} from './tour-filters'

describe('parseTourFilters', () => {
  it('đọc đúng các giá trị hợp lệ', () => {
    expect(
      parseTourFilters({ 'diem-di': 'Hà Nội', 'so-ngay': '3-4', gia: '5-10tr', thang: '2026-10', 'sap-xep': 'gia-tang', trang: '2' }),
    ).toEqual({ from: 'Hà Nội', duration: '3-4', price: '5-10tr', month: '2026-10', sort: 'gia-tang', page: 2 })
  })

  it('bỏ qua giá trị lạ, dùng mặc định', () => {
    expect(
      parseTourFilters({ 'so-ngay': '99', gia: 'constructor', thang: '2026-13', 'sap-xep': '$where', trang: '-3' }),
    ).toEqual({ from: null, duration: null, price: null, month: null, sort: 'moi-nhat', page: 1 })
  })
})

describe('tourFilterWhere', () => {
  it('dựng điều kiện theo từng bộ lọc', () => {
    const filters = parseTourFilters({ 'diem-di': 'Hà Nội', 'so-ngay': '8+', gia: 'duoi-5tr', thang: '2026-10' })
    expect(tourFilterWhere(filters)).toEqual([
      { departureFrom: { equals: 'Hà Nội' } },
      { durationDays: { greater_than_equal: 8 } },
      { price: { less_than: 5_000_000 } },
      { departureMonths: { equals: '2026-10' } },
    ])
  })

  it('không lọc gì thì không có điều kiện', () => {
    expect(tourFilterWhere(parseTourFilters({}))).toEqual([])
  })
})

describe('toFilterQuery', () => {
  it('bỏ sắp xếp mặc định và trang 1; ghi đè được từng giá trị', () => {
    const filters = parseTourFilters({ gia: '5-10tr', trang: '3' })
    expect(toFilterQuery(filters, { price: null, page: 1 })).toEqual({
      'diem-di': null,
      'so-ngay': null,
      gia: null,
      thang: null,
      'sap-xep': null,
      trang: null,
    })
  })
})

describe('departureMonthsOf', () => {
  it('lấy các tháng khác nhau, sắp xếp, bỏ ngày không hợp lệ', () => {
    expect(
      departureMonthsOf([
        { date: '2026-11-05T12:00:00.000Z' },
        { date: '2026-08-20T12:00:00.000Z' },
        { date: '2026-11-19T12:00:00.000Z' },
        { date: 'không phải ngày' },
        { date: null },
      ]),
    ).toEqual(['2026-08', '2026-11'])
  })
})

describe('upcomingMonths', () => {
  it('qua năm mới đúng', () => {
    expect(upcomingMonths(new Date('2026-11-20T00:00:00.000Z'), 3)).toEqual(['2026-11', '2026-12', '2027-01'])
  })
})
