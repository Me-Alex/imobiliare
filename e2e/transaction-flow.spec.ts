import { test, expect } from '@playwright/test'

const accounts: Record<string, string> = JSON.parse(process.env.AUTH_SMOKE_ACCOUNTS || '{}')
test.use({ actionTimeout: 15_000 })
for (const role of ['CLIENT', 'OWNER', 'AGENT', 'ADMIN']) {
  test(`${role} has a simple, contextual account workflow`, async ({ page }) => {
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
      await page.goto('/?page=dashboard')
      await expect(page.getByRole('region', { name: 'Dosare în lucru', exact: true })).toBeVisible()
      await expect(page.getByText('Spațiul contului tău', { exact: true })).toHaveCount(0)
      const caseRows = page.getByRole('region', { name: 'Dosare în lucru' }).locator('button[data-case-id]')
      await expect(caseRows.first()).toBeVisible()
      const ids = await caseRows.evaluateAll(rows => rows.map(row => row.getAttribute('data-case-id')))
      expect(new Set(ids).size).toBe(ids.length)
      await expect(page.locator('aside').filter({ hasText: 'Spațiul meu' })).toHaveCount(0)

      if (process.env.FLOW_CAPTURE) await page.screenshot({ path: `tool-results/simple-${role}-dashboard-${width}.png`, fullPage: true })

      await page.goto('/?page=vizionarile-mele')
      const search = page.getByLabel('Caută o vizionare', { exact: true })
      await expect(search).toBeVisible()
      const viewingId = (await page.locator('div[id^="viewing-"]').first().getAttribute('id'))!.replace('viewing-', '')
      await page.goto(`/?page=vizionarile-mele&appointment=${viewingId}`)
      await expect(page.locator('div[id^="viewing-"]')).toHaveCount(1)
      await expect(page.getByLabel('Caută o vizionare', { exact: true })).toHaveCount(0)
      if (process.env.FLOW_CAPTURE) await page.screenshot({ path: `tool-results/single-${role}-viewing-${width}.png`, fullPage: true })
      await page.getByRole('button', { name: 'Înapoi la dosarele mele', exact: true }).click()
      await expect(page.getByRole('region', { name: 'Dosare în lucru' })).toBeVisible()
      await page.goto('/?page=vizionarile-mele')
      await expect(search).toBeVisible()

      await search.fill('no-matching-viewing-xyz')
      await expect(page.getByRole('tabpanel').getByRole('heading')).toContainText(/Nicio vizionare|Nu ai vizionări/)
      await search.clear()
      await page.getByLabel('Stare', { exact: true }).selectOption('pending')
      await page.getByRole('tab', { name: /După vizită/ }).click()
      await expect(page.getByLabel('Stare', { exact: true })).toHaveValue('all')
      if (role === 'CLIENT') {
        const decision = page.getByRole('button', { name: /Înregistrează decizia|Editează feedbackul/ }).first()
        if (await decision.isVisible()) {
          await decision.click()
          const dialog = page.getByRole('dialog', { name: 'Decizia după vizionare' })
          await expect(dialog.getByRole('radio')).toHaveCount(2)
          await dialog.getByRole('radio', { name: 'Da, vreau să discut oferta' }).check()
          await dialog.getByText('Adaugă feedback (opțional)', { exact: true }).click()
          await dialog.getByLabel('Cum a fost vizita?', { exact: true }).selectOption('0')
          let decisionPayload: Record<string, unknown> | undefined
          await page.route('**/rest/v1/appointments?**', async route => {
            if (route.request().method() !== 'PATCH') return route.continue()
            decisionPayload = route.request().postDataJSON()
            await route.fulfill({ status: 204, body: '' })
          })
          await dialog.getByRole('button', { name: 'Salvează decizia', exact: true }).click()
          await expect(dialog).toBeHidden()
          expect(decisionPayload).toMatchObject({ rating: null, would_proceed: true })
          await page.unroute('**/rest/v1/appointments?**')
        }
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (process.env.FLOW_CAPTURE) await page.screenshot({ path: `tool-results/simple-${role}-viewings-${width}.png`, fullPage: true })

      await page.goto('/?page=deal-room')
      await page.getByRole('button', { name: /Deschide dosarul/ }).first().click()
      await expect(page.getByRole('region', { name: 'Ce urmează în acest dosar' })).toBeVisible()
      await expect(page.getByRole('tablist', { name: 'Secțiunile tranzacției' })).toHaveCount(0)
      await expect(page.locator('#deal-selector')).toHaveCount(0)
      await expect(page.locator('#deal-offer:disabled')).toHaveCount(0)
      if (process.env.FLOW_CAPTURE) await page.screenshot({ path: `tool-results/simple-${role}-deal-${width}.png`, fullPage: true })
      const offerForm = page.locator('#deal-offer')
      if (await offerForm.count()) {
        if (!(await offerForm.isVisible())) await page.getByText('Propune o altă ofertă', { exact: true }).click()
        await offerForm.fill('123456')
        await page.getByLabel('Condițiile ofertei (opțional)', { exact: true }).fill('Draft only')
        await page.getByText('Vizionarea și persoanele implicate', { exact: true }).click()
        await expect(offerForm).toHaveValue('123456')
        await offerForm.clear()
        await page.getByLabel('Condițiile ofertei (opțional)', { exact: true }).clear()
      }
      if (role === 'AGENT' || role === 'ADMIN') {
        const management = page.getByText('Gestionarea tranzacției', { exact: true })
        if (await management.count()) {
          if (!(await page.getByLabel('Responsabil', { exact: true }).isVisible())) await management.click()
          await expect(page.getByLabel('Responsabil', { exact: true })).toBeVisible()
        }
      } else await expect(page.getByLabel('Responsabil', { exact: true })).toHaveCount(0)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const documentSection = page.getByRole('region', { name: 'Documentele tranzacției', exact: true })
      if (!(await documentSection.isVisible())) await page.locator('summary').filter({ hasText: /^Documente/ }).first().click()
      await documentSection.getByRole('button').click()
      await expect(page).toHaveURL(/page=documente.*appointment=/)
      await expect(page.getByLabel('Vizionare selectata', { exact: true })).toHaveCount(0)

      await expect(page.getByRole('heading', { name: 'Documente', exact: true })).toBeVisible()
      await expect(page.getByTestId('document-action-center')).toHaveCount(1)
      await expect(page.getByText('Alege acțiunea, nu secțiunea', { exact: true })).toHaveCount(0)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (process.env.FLOW_CAPTURE) await page.screenshot({ path: `tool-results/simple-${role}-documents-${width}.png`, fullPage: true })
    }
    await page.goto('/?page=vizionarile-mele&appointment=00000000-0000-0000-0000-000000000000')
    await expect(page.getByRole('alert').filter({ hasText: 'Această vizionare nu este disponibilă' })).toBeVisible()
    await expect(page.locator('div[id^="viewing-"]')).toHaveCount(0)
    await page.goto('/?page=deal-room&deal=00000000-0000-0000-0000-000000000000')
    await expect(page.getByRole('button', { name: /Deschide dosarul/ }).first()).toBeVisible()
    await expect(page.getByRole('region', { name: 'Ce urmează în acest dosar' })).toHaveCount(0)
    await page.getByRole('button', { name: /Deschide dosarul/ }).first().click()
    if (role === 'CLIENT') {
      await page.route('**/rest/v1/deal_rooms?**', async route => {
        const response = await route.fetch()
        const rooms = await response.json()
        await route.fulfill({ response, json: rooms.map((room: Record<string, unknown>) => ({ ...room, stage: 'CLOSED_LOST', status: 'CLOSED_LOST' })) })
      })
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Dosar închis', exact: true })).toBeVisible()
      await expect(page.locator('#deal-offer')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Acceptă oferta', exact: true })).toHaveCount(0)
    }
    expect(errors).toEqual([])
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.getByRole('button', { name: 'Meniu utilizator', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Deconectare', exact: true }).click()
  })
}
