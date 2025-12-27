// Single source of truth for test configuration
export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

export async function loginAdmin(page) {
  await page.goto('/admin')
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button:has-text("Enter")')
  await page.waitForSelector('text=+ New Event', { timeout: 10000 })
}