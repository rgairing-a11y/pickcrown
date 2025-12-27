import { test, expect } from '@playwright/test'
import { loginAdmin } from './test-utils'

test.describe('Admin Flows', () => {

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