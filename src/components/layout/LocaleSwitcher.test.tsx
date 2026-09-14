import { describe, expect, it } from 'vitest'

import { renderWithIntl } from '@/test/render'

import { LocaleSwitcher } from './LocaleSwitcher'

describe('LocaleSwitcher', () => {
  it('site mới có tiếng Việt thì không hiện gì', () => {
    const { container } = renderWithIntl(<LocaleSwitcher />)
    expect(container.innerHTML).toBe('')
  })
})
