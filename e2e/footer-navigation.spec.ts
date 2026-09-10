import { test, expect } from '@playwright/test'

test('footer shortcuts clear stale filters and newsletter confirms only successful requests', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => localStorage.setItem('pm-cookies-accepted', 'necessary'))
  let successful = false
  let requests = 0
  let respond: (() => void) | undefined
  await page.route('**/api/newsletter', async route => {
    requests++
    expect(route.request().postDataJSON().email).toBe('reader@example.test')
    await new Promise<void>(resolve => { respond = resolve })
    await route.fulfill(successful
      ? { json: { success: true, message: 'Abonarea a fost salvată.' } }
      : { status: 503, json: { error: 'Abonarea nu este disponibilă momentan. Încearcă din nou mai târziu.' } })
  })
  await page.goto('/?page=proprietati')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const footer = page.locator('footer#contact')
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await footer.scrollIntoViewIfNeeded()
    await expect(footer.getByRole('button', { name: 'Case Militari', exact: true })).toBeHidden()
    await expect(footer.getByRole('button', { name: 'Abonează-te', exact: true })).toBeVisible()
    expect((await footer.getByLabel('Adresa de email', { exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(44)
    if (width < 640) {
      const chat = await page.getByRole('button', { name: 'Deschide chat asistent', exact: true }).boundingBox()
      const privacy = await footer.getByRole('link', { name: 'Politica de confidențialitate', exact: true }).boundingBox()
      expect(privacy!.x + privacy!.width).toBeLessThanOrEqual(chat!.x)
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await footer.screenshot({ path: `tool-results/footer-compact-${width}.png`, animations: 'disabled' })
    await footer.getByRole('button', { name: 'Înapoi sus', exact: true }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  }
  await footer.getByRole('button', { name: 'Abonează-te', exact: true }).click()
  await expect(footer.getByRole('alert')).toContainText('adresă de email')
  expect(requests).toBe(0)
  const email = footer.getByLabel('Adresa de email', { exact: true })
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await email.fill('  reader@example.test  ')
  await footer.getByRole('button', { name: 'Abonează-te', exact: true }).click()
  await expect(footer.getByRole('button', { name: 'Se trimite…', exact: true })).toBeDisabled()
  await expect(email).toBeDisabled()
  await expect.poll(() => requests).toBe(1)
  respond!()
  await expect(footer.getByRole('alert')).toContainText('nu este disponibilă')
  await expect(email).toHaveValue('reader@example.test')
  await expect(footer.getByRole('status')).toHaveCount(0)
  successful = true
  await footer.getByRole('button', { name: 'Abonează-te', exact: true }).click()
  await expect.poll(() => requests).toBe(2)
  respond!()
  await expect(footer.getByRole('status')).toContainText('Abonarea a fost salvată.')
  await expect(email).toHaveValue('')

  // Both kinds of shortcut must start from a clean search, even in an existing filtered catalog.
  for (const [group, action, expectedType] of [
    ['Căutări populare', 'Case Militari', 'Casă'],
    ['Tipuri de proprietăți', 'Apartamente', 'Apartament'],
  ]) {
    const expand = page.getByRole('button', { name: 'Zonă, buget și alte filtre' })
    if (await expand.isVisible()) await expand.click()
    await page.getByLabel('Preț minim în euro', { exact: true }).fill('100')
    await page.getByLabel('Preț maxim în euro', { exact: true }).fill('500')
    await page.getByLabel('Suprafață minimă în metri pătrați', { exact: true }).fill('300')
    await page.getByLabel('Suprafață maximă în metri pătrați', { exact: true }).fill('400')
    await page.getByRole('switch', { name: 'Doar proprietăți populare', exact: true }).check()
    await page.getByRole('combobox', { name: 'Filtru tur virtual', exact: true }).click()
    await page.getByRole('option', { name: 'Cu tur virtual', exact: true }).click()
    await page.getByRole('combobox', { name: 'Ordonează proprietățile', exact: true }).click()
    await page.getByRole('option', { name: 'Preț crescător', exact: true }).click()
    await footer.locator('summary').filter({ hasText: group }).click()
    await footer.getByRole('button', { name: action, exact: true }).click()
    await expect(page.getByRole('combobox', { name: 'Tip de proprietate', exact: true })).toContainText(expectedType)
    await expect(page.getByLabel('Preț minim în euro', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('Preț maxim în euro', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('Suprafață minimă în metri pătrați', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('Suprafață maximă în metri pătrați', { exact: true })).toHaveValue('')
    await expect(page.getByRole('switch', { name: 'Doar proprietăți populare', exact: true })).not.toBeChecked()
    await expect(page.getByRole('combobox', { name: 'Filtru tur virtual', exact: true })).toContainText('Toate proprietățile')
    await expect(page.getByRole('combobox', { name: 'Ordonează proprietățile', exact: true })).toContainText('Cele mai noi')
    await expect(page.getByRole('combobox', { name: 'Zonă', exact: true })).toContainText(action === 'Case Militari' ? 'Militari' : 'Toate zonele')
  }
  await footer.getByRole('button', { name: 'Preferințe cookies', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Doar necesare', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
