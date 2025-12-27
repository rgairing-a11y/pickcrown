import { test, expect } from '@playwright/test'

test.describe('Admin Flows', () => {

  async function loginAdmin(page) {
    await page.goto('/admin')
    await page.fill('input[type="password"]', 'pickcrown2025')
    await page.click('button:has-text("Enter")')
    await expect(page.locator('text=+ New Event')).toBeVisible({ timeout: 10000 })
  }

  test('can navigate to create event page', async ({ page }) => {
    await loginAdmin(page)
    
    await page.click('text=+ New Event')
    
    await expect(page.getByText('Create New Event')).toBeVisible()
  })

  test('create event form has required fields', async ({ page }) => {
    await loginAdmin(page)
    await page.click('text=+ New Event')
    
    await expect(page.getByText('Event Name')).toBeVisible()
    await expect(page.getByText('Year')).toBeVisible()
    await expect(page.getByText('Event Type')).toBeVisible()
    await expect(page.getByText('Start Time')).toBeVisible()
  })

  test('can navigate to create pool page', async ({ page }) => {
    await loginAdmin(page)
    
    await page.goto('/admin/pools/new')
    
    await expect(page.getByText('Create New Pool')).toBeVisible()
  })

})