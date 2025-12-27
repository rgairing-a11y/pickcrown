import { test, expect } from '@playwright/test'

test.describe('Pool Pages', () => {

  test('invalid pool shows not found', async ({ page }) => {
    await page.goto('/pool/invalid-pool-id-12345')
    
    await expect(page.locator('text=Pool Not Found')).toBeVisible()
  })

  test('standings page for invalid pool shows not found', async ({ page }) => {
    await page.goto('/pool/invalid-pool-id-12345/standings')
    
    await expect(page.locator('text=Pool Not Found')).toBeVisible()
  })

})