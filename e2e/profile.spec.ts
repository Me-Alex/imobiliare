import { test, expect, type Page } from '@playwright/test'

const accounts: Record<string, string> = JSON.parse(process.env.AUTH_SMOKE_ACCOUNTS || '{}')
const destinations: Record<string, string[]> = {
  CLIENT: ['dashboard', 'programare-vizionare', 'vizionarile-mele', 'deal-room', 'documente', 'monede'],
  OWNER: ['dashboard', 'proprietatile-mele', 'owner-dashboard', 'vizionarile-mele', 'deal-room', 'documente', 'monede'],
  AGENT: ['dashboard', 'crm', 'adauga-proprietate', 'vizionarile-mele', 'deal-room', 'documente', 'disponibilitate-staff', 'monede'],
  ADMIN: ['admin', 'dashboard', 'crm', 'proprietatile-mele', 'owner-dashboard', 'adauga-proprietate', 'vizionarile-mele', 'deal-room', 'documente', 'disponibilitate-staff', 'monede'],
}

async function openProfile(page: Page, role = 'CLIENT') {
  test.skip(!accounts[role] || !process.env.AUTH_SMOKE_PASSWORD, 'Provide dedicated demo credentials.')
  await page.goto('/?page=login')
  await page.getByLabel('Email', { exact: true }).fill(accounts[role])
  await page.getByLabel('Parola', { exact: true }).fill(process.env.AUTH_SMOKE_PASSWORD!)
  await page.getByRole('button', { name: 'Autentifică-te', exact: true }).click()
  await expect(page).toHaveURL(/page=dashboard/)
  await page.goto('/?page=profil')
  await expect(page.getByRole('heading', { name: 'Profilul meu', exact: true })).toBeVisible()
  const cookies = page.getByRole('button', { name: 'Doar necesare', exact: true })
  if (await cookies.isVisible()) await cookies.click()
}

async function logout(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('button', { name: 'Meniu utilizator', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Deconectare', exact: true }).click()
  await expect(page.getByRole('banner').getByRole('button', { name: 'Intră în cont', exact: true })).toBeVisible()
}

for (const role of Object.keys(destinations)) {
  test(`${role} profile offers working links to every permitted account page`, async ({ page }) => {
    test.setTimeout(180_000)
    await openProfile(page, role)
    const navigation = page.getByRole('navigation', { name: 'Navigare din profil', exact: true })
    await expect(navigation.getByRole('button')).toHaveCount(destinations[role].length)
    for (const [index, destination] of destinations[role].entries()) {
      await navigation.getByRole('button').nth(index).click()
      await expect(page).toHaveURL(new RegExp(`page=${destination}(?:&|$)`))
      await page.goBack()
      await expect(page.getByRole('heading', { name: 'Profilul meu', exact: true })).toBeVisible()
    }
    if (role === 'CLIENT' && process.env.PROFILE_CAPTURE) {
      await page.evaluate(() => window.scrollTo(0, 0))
      await expect(page.getByRole('heading', { name: 'Profilul meu', exact: true })).toBeInViewport()
      await page.screenshot({ path: 'tool-results/profile-desktop.png', fullPage: true })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: 'tool-results/profile-mobile.png', fullPage: true })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.getByRole('link', { name: 'Paginile contului', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Unde vrei să mergi?', exact: true })).toBeInViewport()
    }
    await logout(page)
  })
}

test('profile tabs, unsaved changes, theme, and account actions are understandable and usable', async ({ page }) => {
  await openProfile(page)
  const save = page.getByRole('button', { name: 'Salvează modificările', exact: true })
  await expect(save).toBeDisabled()
  const name = page.getByLabel('Nume complet', { exact: false })
  const original = await name.inputValue()
  await name.fill('')
  await save.click()
  await expect(page.getByRole('alert').filter({ hasText: 'Completează numele' })).toBeVisible()
  await name.fill(`${original} test`)
  await page.getByRole('tab', { name: 'Date personale', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Preferințe', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: 'Întunecat', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Luminos', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.getByRole('tab', { name: 'Date personale', exact: true }).click()
  await expect(name).toHaveValue(`${original} test`)
  await page.getByRole('button', { name: 'Prezentarea contului', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Rămân în profil', exact: true }).click()
  await page.getByRole('button', { name: 'Anulează', exact: true }).click()
  await expect(name).toHaveValue(original)
  await expect(save).toBeDisabled()
  await page.getByRole('tab', { name: 'Cont și date', exact: true }).click()
  await page.getByRole('button', { name: 'Schimbă în Proprietar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Treci la contul Proprietar?', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Păstrează contul actual', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descarcă profilul', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('hqs-profilul-meu.json')
  await logout(page)
})

test('profile changes recover from a failed save and persist after successful save', async ({ page }) => {
  await openProfile(page)
  const bio = page.getByLabel('Despre tine', { exact: false })
  const original = await bio.inputValue()
  const marker = `Verificare profil ${Date.now()}`
  const save = page.getByRole('button', { name: 'Salvează modificările', exact: true })
  let restoreNeeded = false
  try {
    await page.route('**/rest/v1/profiles?*', async route => {
      if (route.request().method() === 'PATCH') await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Temporarily unavailable' }) })
      else await route.continue()
    })
    await bio.fill(marker)
    await save.click()
    await expect(page.getByRole('alert').filter({ hasText: 'Nu am putut salva' })).toBeVisible()
    await expect(bio).toHaveValue(marker)
    await page.unroute('**/rest/v1/profiles?*')
    restoreNeeded = true
    await save.click()
    await expect(page.getByText('Modificările au fost salvate.', { exact: true })).toBeVisible()
    await page.reload()
    await expect(bio).toHaveValue(marker)
  } finally {
    await page.unroute('**/rest/v1/profiles?*')
    if (restoreNeeded) {
      await bio.fill(original)
      await save.click()
      await expect(save).toBeDisabled()
    } else {
      const cancel = page.getByRole('button', { name: 'Anulează', exact: true })
      if (await cancel.isVisible()) await cancel.click()
    }
    await logout(page)
  }
})

test('changing account type updates navigation and can be reversed', async ({ page }) => {
  await openProfile(page)
  await page.getByRole('tab', { name: 'Cont și date', exact: true }).click()
  try {
    await page.getByRole('button', { name: 'Schimbă în Proprietar', exact: true }).click()
    await page.getByRole('button', { name: 'Confirmă contul Proprietar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Tip de cont: Proprietar', exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Navigare din profil', exact: true }).getByRole('button', { name: /Proprietățile mele/ })).toBeVisible()
  } finally {
    const changeBack = page.getByRole('button', { name: 'Schimbă în Client', exact: true })
    if (await changeBack.isVisible()) {
      await changeBack.click()
      await page.getByRole('button', { name: 'Confirmă contul Client', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Tip de cont: Client', exact: true })).toBeVisible()
    }
    await logout(page)
  }
})
