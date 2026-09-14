import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Rosa Travel/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Những hành trình mới đang được chuẩn bị')
  })
})
