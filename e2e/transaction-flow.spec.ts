import { test, expect } from '@playwright/test'

const accounts: Record<string, string> = JSON.parse(process.env.AUTH_SMOKE_ACCOUNTS || '{}')
test.use({ actionTimeout: 15_000 })
for (const role of ['CLIENT', 'OWNER', 'AGENT', 'ADMIN']) {
  test(`${role} can understand and navigate the viewing and transaction workflow`, async ({ page }) => {
    test.setTimeout(180_000)
    test.skip(!accounts[role] || !process.env.AUTH_SMOKE_PASSWORD, 'Dedicated demo credentials required.')
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/?page=login')
    await page.getByLabel('Email', { exact: true }).fill(accounts[role])
    await page.getByLabel('Parola', { exact: true }).fill(process.env.AUTH_SMOKE_PASSWORD!)
    await page.getByRole('button', { name: 'Autentifică-te', exact: true }).click()
    await expect(page).toHaveURL(/page=dashboard/)
    const cookies = page.getByRole('button', { name: 'Doar necesare', exact: true })
    if (await cookies.isVisible()) await cookies.click()
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/?page=vizionarile-mele')
      await expect(page.getByLabel('Caută o vizionare', { exact: true })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Cum decurge vizionarea' })).toBeVisible()
      await page.getByLabel('Caută o vizionare', { exact: true }).fill('no-matching-viewing-xyz')
      await expect(page.getByRole('tabpanel').getByRole('heading')).toContainText(/Nicio vizionare|Nu ai vizionări/)
      await page.getByLabel('Caută o vizionare', { exact: true }).clear()
      await page.getByLabel('Stare', { exact: true }).selectOption('pending')
      await page.getByRole('tab', { name: /Istoric/ }).click()
      await expect(page.getByLabel('Stare', { exact: true })).toHaveValue('all')
      await page.getByRole('tab', { name: /Programări/ }).click()
      if (role === 'CLIENT') {
        await page.getByRole('button', { name: 'Reprogramează', exact: true }).first().click()
        await expect(page.getByRole('dialog', { name: 'Schimbi programarea?' })).toBeVisible()
        await page.getByRole('button', { name: 'Păstrează programarea', exact: true }).click()
        await expect(page.getByRole('dialog')).toBeHidden()
        await expect(page).toHaveURL(/page=vizionarile-mele/)
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (process.env.FLOW_CAPTURE && role === 'CLIENT') await page.screenshot({ path: `tool-results/viewings-flow-${width}.png`, fullPage: true, animations: 'disabled' })
      await page.getByRole('tab', { name: /După vizită/ }).click()
      if (role === 'CLIENT') {
        const decision = page.getByRole('button', { name: /Înregistrează decizia|Editează feedbackul/ }).first()
        if (await decision.isVisible()) {
          await decision.click()
          const dialog = page.getByRole('dialog', { name: 'Decizia după vizionare' })
          await expect(dialog).toBeVisible()
          await expect(dialog.getByRole('radio')).toHaveCount(2)
          await dialog.getByRole('radio', { name: 'Da, vreau să discut oferta' }).check()
          await expect(dialog.getByRole('radio', { name: 'Nu, proprietatea nu mi se potrivește' })).not.toBeChecked()
          await dialog.getByRole('button', { name: 'Anuleaza', exact: true }).click()
        }
      }
      await page.goto('/?page=deal-room')
      await page.getByRole('button', { name: /Deschide dosarul/ }).first().click()
      await page.getByText('Consultă alte informații din dosar', { exact: true }).click()
      const tabs = page.getByRole('tablist', { name: 'Secțiunile tranzacției' })
      await expect(tabs).toBeVisible()
      await expect(page.getByRole('region', { name: 'Parcursul dosarului' })).toBeVisible()
      for (const label of ['Vizionare', 'Documente', 'Oferte', 'Pașii următori', 'Activitate']) {
        await tabs.getByRole('tab', { name: label, exact: true }).click()
        await expect(page.getByRole('tabpanel')).toHaveCount(1)
        await expect(page.getByRole('tabpanel')).toBeVisible()
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
      await tabs.getByRole('tab', { name: 'Oferte', exact: true }).click()
      const notes = page.getByLabel('Condițiile ofertei (opțional)', { exact: true })
      if (await notes.isEnabled()) {
        await notes.fill('Browser test: unsaved draft')
        await tabs.getByRole('tab', { name: 'Vizionare', exact: true }).click()
        await tabs.getByRole('tab', { name: 'Oferte', exact: true }).click()
        await expect(notes).toHaveValue('Browser test: unsaved draft')
        await notes.clear()
      }
      await tabs.getByRole('tab', { name: 'Pașii următori', exact: true }).click()
      if (role === 'AGENT' || role === 'ADMIN') await expect(page.getByLabel('Responsabil', { exact: true })).toBeVisible()
      else await expect(page.getByLabel('Responsabil', { exact: true })).toHaveCount(0)
      await tabs.getByRole('tab', { name: 'Vizionare', exact: true }).focus()
      await page.keyboard.press('ArrowRight')
      await expect(tabs.getByRole('tab', { name: 'Documente', exact: true })).toHaveAttribute('aria-selected', 'true')
      await tabs.getByRole('tab', { name: 'Vizionare', exact: true }).click()
      if (process.env.FLOW_CAPTURE && role === 'CLIENT') {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: `tool-results/transaction-flow-${width}.png`, fullPage: true, animations: 'disabled' })
      }
      const offerAction = page.getByRole('button', { name: 'Vezi oferta', exact: true })
      if (await offerAction.isVisible()) {
        await offerAction.click()
        await expect(tabs.getByRole('tab', { name: 'Oferte', exact: true })).toHaveAttribute('aria-selected', 'true')
      }
    }
    await page.goto('/?page=deal-room&deal=00000000-0000-0000-0000-000000000000')
    await expect(page.getByRole('region', { name: 'Ce urmează în acest dosar' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Deschide dosarul/ }).first()).toBeVisible()
    await page.getByRole('button', { name: /Deschide dosarul/ }).first().click()
    await expect(page.getByRole('region', { name: 'Ce urmează în acest dosar' })).toBeVisible()
    if (role === 'CLIENT') {
      await page.route('**/rest/v1/deal_rooms?**', async route => {
        const response = await route.fetch()
        const rooms = await response.json()
        await route.fulfill({ response, json: rooms.map((room: Record<string, unknown>) => ({ ...room, stage: 'CLOSED_LOST', status: 'CLOSED_LOST' })) })
      })
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Dosar închis', exact: true })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Parcursul dosarului' }).locator('[aria-current="step"]')).toHaveCount(1)
    }
    expect(errors).toEqual([])
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.getByRole('button', { name: 'Meniu utilizator', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Deconectare', exact: true }).click()
  })
}
