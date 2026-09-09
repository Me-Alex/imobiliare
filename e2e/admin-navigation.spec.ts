import { test, expect } from '@playwright/test'
import type { AdminDashboardData } from '../src/lib/admin-dashboard'

test('admin navigation exposes every section and global search opens the exact record', async ({ page }) => {
  test.setTimeout(180_000)
  test.skip(!process.env.AUTH_ADMIN_EMAIL || !process.env.AUTH_SMOKE_PASSWORD, 'Dedicated demo admin credentials required.')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  // Read the dashboard, then replace only the search rows with synthetic edge cases.
  await page.route('**/api/admin/dashboard', async route => {
    const response = await route.fetch()
    const data: AdminDashboardData = await response.json()
    data.leads = Array.from({ length: 12 }, (_, index) => ({
      id: `qa-lead-${index}`, name: `Solicitare QA ${index}`, email: `qa${index}@example.test`, phone: null,
      status: index === 11 ? 'CLOSED' : 'NEW', source: 'website', score: 50, agent_id: null, property_id: null,
      response_due_at: null, next_follow_up_at: null, created_at: '2026-09-10T00:00:00Z',
    }))
    data.deals = Array.from({ length: 9 }, (_, index) => ({
      id: `qa-deal-${index}`, title: `Tranzacție QA ${index}`, stage: 'OFFER', status: 'ACTIVE',
      next_step: 'Discută oferta', next_step_due_at: null, agent_id: null, updated_at: '2026-09-10T00:00:00Z',
    }))
    await route.fulfill({ response, json: data })
  })
  await page.goto('/?page=login')
  await page.getByLabel('Email', { exact: true }).fill(process.env.AUTH_ADMIN_EMAIL!)
  await page.getByLabel('Parola', { exact: true }).fill(process.env.AUTH_SMOKE_PASSWORD!)
  await page.getByRole('button', { name: 'Autentifică-te', exact: true }).click()
  await expect(page).toHaveURL(/page=dashboard/)
  await page.goto('/?page=admin')
  await expect(page.getByRole('heading', { name: 'Centru de administrare', exact: true })).toBeVisible()
  const cookies = page.getByRole('button', { name: 'Doar necesare', exact: true })
  if (await cookies.isVisible()) await cookies.click()
  const sections = ['home', 'tasks', 'properties', 'people', 'transactions', 'settings', 'inbox', 'compliance', 'virtual-tours', 'audit']
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [index, section] of sections.entries()) {
      if (width < 640) await page.getByLabel('Secțiunea administrativă', { exact: true }).selectOption(section)
      else await page.getByRole('tablist', { name: 'Secțiunile administrării', exact: true }).getByRole('tab').nth(index).click()
      await expect(page.getByRole('tabpanel')).toBeVisible()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    await expect.poll(() => page.getByRole('navigation', { name: 'Acces rapid în cont' }).locator('button > span').evaluateAll(labels => labels.every(label => label.scrollWidth <= label.clientWidth))).toBe(true)
    if (width < 640) await page.getByLabel('Secțiunea administrativă', { exact: true }).selectOption('home')
    else await page.getByRole('tab', { name: 'Prezentare', exact: true }).click()
    await page.screenshot({ path: `tool-results/admin-final-${width}.png`, animations: 'disabled', fullPage: true })
  }
  for (const item of [
    { query: 'Solicitare QA 10', target: 'admin-lead-qa-lead-10' },
    { query: 'Solicitare QA 11', target: 'admin-lead-qa-lead-11' },
    { query: 'Tranzacție QA 8', target: 'admin-deal-qa-deal-8' },
  ]) {
    await page.getByLabel('Căutare globală în administrare', { exact: true }).fill(item.query)
    await page.getByRole('button', { name: new RegExp(item.query) }).click()
    await expect(page.getByTestId(item.target)).toBeVisible()
    await expect(page.locator('#admin-search-target')).toBeFocused()
    await expect(page.getByTestId('admin-lead-qa-lead-0')).toBeHidden()
    if (item.target.includes('deal')) {
      await page.screenshot({ path: 'tool-results/admin-exact-result-320.png', animations: 'disabled' })
      await page.getByRole('button', { name: 'Deschide tranzacția', exact: true }).click()
      await expect(page).toHaveURL(/page=deal-room/)
      await expect(page).toHaveURL(/deal=qa-deal-8/)
    } else await page.getByRole('button', { name: 'Toate operațiunile', exact: true }).click()
  }
  expect(errors).toEqual([])
})
