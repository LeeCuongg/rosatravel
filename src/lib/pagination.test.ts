import { describe, expect, it } from 'vitest'

import { paginationRange } from './pagination'

describe('paginationRange', () => {
  it('ít trang thì hiện hết', () => {
    expect(paginationRange(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('nhiều trang thì rút gọn quanh trang hiện tại', () => {
    expect(paginationRange(1, 10)).toEqual([1, 2, 'gap', 10])
    expect(paginationRange(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10])
    expect(paginationRange(10, 10)).toEqual([1, 'gap', 9, 10])
  })
})
