import { test, expect } from '@playwright/test'

test('invalid form input never submits a password request', async ({ page }) => {
  let passwordRequests = 0
  page.on('request', request => { if (request.url().includes('/auth/v1/token')) passwordRequests++ })
  await page.goto('/?page=login')
  await page.getByRole('button', { name: 'Autentifică-te', exact: true }).click()
  await expect(page.locator('#email:invalid')).toBeVisible()
  expect(passwordRequests).toBe(0)
})

test('login remains usable when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      Object.defineProperty(Storage.prototype, method, { value: () => { throw new DOMException('Blocked', 'SecurityError') } })
    }
  })
  await page.goto('/?page=login')
  await expect(page.getByRole('heading', { name: 'Bine ai revenit!' })).toBeVisible()
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Doar necesare', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Doar necesare', exact: true })).toBeHidden()
})

test('mobile registration shows valid controls without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?page=login')
  await page.getByRole('button', { name: 'Doar necesare', exact: true }).click()
  await page.getByRole('button', { name: 'Înregistrează-te', exact: true }).click()
  await expect(page.getByLabel('Nume complet')).toBeVisible()
  await page.getByLabel('Parola', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'Arată parola', exact: true }).click()
  await expect(page.locator('#password')).toHaveAttribute('type', 'text')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('Google login reaches the provider with the current-origin callback', async ({ page }) => {
  await page.goto('/?page=login')
  const outgoing = page.waitForRequest(request => request.url().includes('/auth/v1/authorize'))
  await page.getByRole('button', { name: 'Continuă cu Google', exact: true }).click()
  const authorization = new URL((await outgoing).url())
  expect(authorization.searchParams.get('redirect_to')).toBe(`${new URL(test.info().project.use.baseURL as string).origin}/?page=login&auth_callback=google`)
  await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com\//)
})

const accounts: Record<string, string> = JSON.parse(process.env.AUTH_SMOKE_ACCOUNTS || '{}')
for (const role of ['CLIENT', 'OWNER', 'AGENT', 'ADMIN']) {
  test(`${role} can log in, reload, return from login, and log out`, async ({ page }) => {
    test.skip(!accounts[role] || !process.env.AUTH_SMOKE_PASSWORD, 'Provide dedicated demo credentials in the environment.')
    await page.goto('/?page=login')
    await page.getByLabel('Email', { exact: true }).fill(accounts[role])
    await page.getByLabel('Parola', { exact: true }).fill(process.env.AUTH_SMOKE_PASSWORD!)
    await page.getByRole('button', { name: 'Autentifică-te', exact: true }).click()
    await expect(page).toHaveURL(/page=dashboard/)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Meniu utilizator', exact: true })).toBeVisible()
    await page.goto('/?page=login')
    await expect(page).toHaveURL(/page=dashboard/)
    await page.getByRole('button', { name: 'Meniu utilizator', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Deconectare', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Intră în cont', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Intră în cont', exact: true })).toBeVisible()
  })
}
