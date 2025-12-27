import { test, expect } from '@playwright/test'
import { ADMIN_PASSWORD } from './test-utils'

test.describe('Smoke Tests', () => {
  
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /PickCrown/i })).toBeVisible()
  })

  test('home page shows pools section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Active Pools')).toBeVisible()
  })

  test('admin page requires password', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByText('Admin Access')).toBeVisible()
  })

  test('admin page rejects wrong password', async ({ page }) => {
    await page.goto('/admin')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Enter")')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('admin page accepts correct password', async ({ page }) => {
    await page.goto('/admin')
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button:has-text("Enter")')
    await expect(page.locator('text=+ New Event')).toBeVisible({ timeout: 10000 })
  })

})