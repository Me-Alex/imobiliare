import { test, expect } from '@playwright/test'

test.use({ actionTimeout: 15_000 })

const accounts: Record<string, string> = JSON.parse(process.env.AUTH_SMOKE_ACCOUNTS || '{}')
const routes: Record<string, string[]> = {
  CLIENT: ['dashboard', 'programare-vizionare', 'vizionarile-mele', 'deal-room', 'documente', 'monede', 'profil'],
  OWNER: ['dashboard', 'proprietatile-mele', 'owner-dashboard', 'vizionarile-mele', 'deal-room', 'documente', 'monede', 'profil'],
  AGENT: ['dashboard', 'crm', 'adauga-proprietate', 'vizionarile-mele', 'deal-room', 'documente', 'disponibilitate-staff', 'monede', 'profil'],
  ADMIN: ['admin', 'dashboard', 'crm', 'proprietatile-mele', 'owner-dashboard', 'adauga-proprietate', 'vizionarile-mele', 'deal-room', 'documente', 'disponibilitate-staff', 'monede', 'profil'],
}

for (const [role, destinations] of Object.entries(routes)) {
  test(`${role} can reach every account section on desktop and mobile`, async ({ page }) => {
    test.setTimeout(300_000)
    test.skip(!accounts[role] || !process.env.AUTH_SMOKE_PASSWORD, 'Provide dedicated demo credentials.')
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/?page=login')
    await page.getByLabel('Email', { exact: true }).fill(accounts[role])
    await page.getByLabel('Parola', { exact: true }).fill(process.env.AUTH_SMOKE_PASSWORD!)
    await page.getByRole('button', { name: 'Autentifică-te', exact: true }).click()
    await expect(page).toHaveURL(/page=dashboard/)
    await expect(page.getByRole('navigation', { name: 'Acces rapid în cont', exact: true }).getByRole('button')).toHaveCount(3)
    const cookies = page.getByRole('button', { name: 'Doar necesare', exact: true })
    if (await cookies.isVisible()) await cookies.click()
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 })
      const trigger = page.getByRole('button', { name: 'Deschide meniul contului', exact: true })
      await expect(trigger).toHaveText('Meniu')
      await trigger.click()
      const menu = page.getByRole('dialog', { name: 'Meniul contului', exact: true })
      await expect(menu).toBeVisible()
      await expect(page.locator('button[aria-label="Deschide meniul contului"]')).toHaveAttribute('aria-expanded', 'true')
      await expect(menu.getByRole('button', { name: 'Închide meniul contului', exact: true })).toBeFocused()
      await expect(menu.locator('button[data-page="dashboard"]')).toBeVisible()
      expect(await menu.getByRole('navigation', { name: 'Secțiunile contului', exact: true }).evaluate(element => element.scrollTop)).toBe(0)
      const search = menu.getByRole('searchbox', { name: 'Caută o secțiune în cont', exact: true })
      await search.fill('VIZIONARI')
      await expect(menu.locator('button[data-page="vizionarile-mele"]')).toBeVisible()
      await search.fill('no-account-page-matches')
      await expect(menu.getByRole('status')).toContainText('Nicio secțiune găsită')
      await expect(menu.locator('button[data-page]')).toHaveCount(0)
      await menu.getByRole('button', { name: 'Șterge căutarea din meniu', exact: true }).click()
      await expect(search).toBeFocused()
      await expect(menu.locator('button[data-page]')).toHaveCount(destinations.length)
      if (process.env.WORKSPACE_CAPTURE) await page.screenshot({ path: `tool-results/account-menu-${role}-${width}.png`, animations: 'disabled' })
      await page.keyboard.press('Escape')
      await expect(menu).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      for (const destination of destinations) {
        await page.getByRole('button', { name: 'Deschide meniul contului', exact: true }).click()
        const navigation = page.getByRole('navigation', { name: 'Secțiunile contului', exact: true })
        await expect(navigation.locator('button[data-page]')).toHaveCount(destinations.length)
        const target = navigation.locator(`button[data-page="${destination}"]`)
        await target.click()
        await expect(page).toHaveURL(new RegExp(`page=${destination}(?:&|$)`))
        if (width === 390) await expect(page.getByRole('dialog')).toBeHidden()
        await expect(page.locator(`#main-content [data-page="${destination}"] h1`).first()).toBeVisible()
        await expect.soft.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { timeout: 10_000, message: `${role} ${destination} at ${width}px should fit the screen` }).toBe(true)
        await expect(page.getByRole('button', { name: 'Meniu', exact: true })).toBeHidden()
        await expect(page.getByRole('button', { name: 'Meniu utilizator', exact: true })).toBeVisible()
        if (destination === 'crm') {
          const search = page.getByRole('textbox', { name: 'Caută un client', exact: true })
          await search.fill('no-client-matches-this-query')
          await expect(page.getByText('Nu există clienți pentru această selecție.', { exact: true })).toBeVisible()
          await page.getByRole('button', { name: 'Resetează filtrele', exact: true }).click()
          await expect(search).toHaveValue('')
          await page.getByRole('combobox', { name: 'Etapă', exact: true }).selectOption('closed')
          await expect(page.getByRole('button', { name: /Mută în etapa/ })).toHaveCount(0)
          await page.getByRole('combobox', { name: 'Etapă', exact: true }).selectOption('active')
          await page.getByRole('tab', { name: /Contactări planificate/ }).click()
          await expect(page.getByRole('tabpanel')).toContainText('Contactările sunt ordonate după termen.')
          await page.getByRole('tab', { name: 'Clienți', exact: true }).click()
        }
        const help = page.locator('#main-content details').first()
        if (await help.count()) {
          await expect(help).not.toHaveAttribute('open', '')
          await help.locator(':scope > summary').click()
          await expect(help).toHaveAttribute('open', '')
          await help.locator(':scope > summary').click()
        }
        if (process.env.WORKSPACE_CAPTURE && (role === 'OWNER' || role === 'ADMIN' || (role === 'CLIENT' && destination === 'programare-vizionare'))) {
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.screenshot({ path: `tool-results/workspace-${role}-${destination}-${width}.png`, fullPage: true })
        }
      }
    }
    await page.setViewportSize({ width: 320, height: 568 })
    const compactTrigger = page.getByRole('button', { name: 'Deschide meniul contului', exact: true })
    await expect(compactTrigger).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
    await compactTrigger.click()
    const compactMenu = page.getByRole('dialog', { name: 'Meniul contului', exact: true })
    const close = compactMenu.getByRole('button', { name: 'Închide meniul contului', exact: true })
    await expect(close).toBeVisible()
    await expect(close).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(compactMenu.getByRole('searchbox')).toBeFocused()
    expect(await page.locator('[data-slot="sheet-overlay"]').evaluate(element => getComputedStyle(element).animationName)).toBe('none')
    await page.keyboard.press('Shift+Tab')
    await expect(close).toBeFocused()
    const closeBox = await close.boundingBox()
    expect(closeBox!.width).toBeGreaterThanOrEqual(44)
    expect(closeBox!.height).toBeGreaterThanOrEqual(44)
    await expect(compactMenu.getByRole('button', { name: 'Ajutor', exact: true })).toBeVisible()
    if (process.env.WORKSPACE_CAPTURE) await page.screenshot({ path: `tool-results/account-menu-${role}-320.png`, animations: 'disabled' })
    await close.click()
    await expect(compactTrigger).toBeFocused()
    expect(errors).toEqual([])
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.getByRole('button', { name: 'Meniu utilizator', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Deconectare', exact: true }).click()
    await expect(page.getByRole('banner').getByRole('button', { name: 'Intră în cont', exact: true })).toBeVisible()
  })
}
