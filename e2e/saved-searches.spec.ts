import { test, expect, type Page } from '@playwright/test'

async function openSearches(page: Page) {
  if (page.viewportSize()!.width < 640) {
    await page.getByRole('button', { name: 'Meniu', exact: true }).click()
    await page.getByRole('button', { name: /^Căutări salvate/ }).click()
  } else {
    await page.getByRole('button', { name: 'Căutare și alerte', exact: true }).click()
    await page.getByRole('menuitem', { name: /^Căutări salvate/ }).click()
  }
  return page.getByRole('dialog', { name: 'Căutări salvate', exact: true })
}

test('saved searches preserve criteria, report storage failures and recover deletions on phones', async ({ page }) => {
  test.setTimeout(150_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function(key, value) {
      if (key === 'pm-saved-searches' && sessionStorage.getItem('qa-block-saved-writes')) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.goto('/?page=proprietati')
  const cookies = page.getByRole('button', { name: 'Doar necesare', exact: true })
  if (await cookies.isVisible()) await cookies.click()
  await page.getByRole('button', { name: 'Zonă, buget și alte filtre' }).click()
  await page.getByLabel('Preț maxim în euro', { exact: true }).fill('1000000')
  await page.getByRole('button', { name: 'Salvează căutarea', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Salvează căutarea', exact: true })
  await expect(dialog).toContainText('Buget: până la 1.000.000 €')
  await dialog.getByLabel('Numele căutării', { exact: true }).fill('Buget verificat')
  await dialog.getByRole('button', { name: 'Anulează', exact: true }).click()
  await page.getByRole('button', { name: 'Salvează căutarea', exact: true }).click()
  await expect(dialog.getByLabel('Numele căutării', { exact: true })).toHaveValue('')
  await dialog.getByRole('button', { name: 'Salvează', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Scrie un nume')
  await expect(dialog.getByLabel('Numele căutării', { exact: true })).toBeFocused()
  await dialog.getByLabel('Numele căutării', { exact: true }).fill('Buget verificat')
  await page.evaluate(() => sessionStorage.setItem('qa-block-saved-writes', '1'))
  await dialog.getByRole('button', { name: 'Salvează', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('nu a fost salvată')
  await expect(dialog.getByLabel('Numele căutării', { exact: true })).toHaveValue('Buget verificat')
  await page.evaluate(() => sessionStorage.removeItem('qa-block-saved-writes'))
  await dialog.getByRole('button', { name: 'Salvează', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('pm-saved-searches')!)[0].filters.priceRange)).toEqual([0, 1000000])
  await page.getByLabel('Preț maxim în euro', { exact: true }).fill('')
  let panel = await openSearches(page)
  await panel.getByRole('button', { name: 'Vezi proprietățile: Buget verificat', exact: true }).click()
  await expect(page.getByLabel('Preț maxim în euro', { exact: true })).toHaveValue('1000000')

  await page.evaluate(() => {
    const existing = JSON.parse(localStorage.getItem('pm-saved-searches')!)
    existing.unshift({ id: 'complete', name: 'Casă cu grădină și spațiu pentru familie', createdAt: new Date().toISOString(), filters: {
      searchQuery: 'grădină-' + 'a'.repeat(90), minArea: '75', maxArea: '150', featuredOnly: true,
      virtualTourFilter: 'with', sort: 'priceAsc', priceRange: [50000, null], priceRangeVersion: 2,
    } })
    localStorage.setItem('pm-saved-searches', JSON.stringify(existing))
    window.dispatchEvent(new Event('pm-saved-searches-updated'))
  })
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 })
    panel = await openSearches(page)
    for (const text of ['Suprafață: 75–150 m²', 'Doar populare', 'Cu tur virtual', 'Ordine: Preț crescător', 'Buget: de la 50.000 €']) await expect(panel).toContainText(text)
    await expect.poll(() => panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.screenshot({ path: `tool-results/saved-searches-${width}.png`, animations: 'disabled' })
    await panel.getByRole('button', { name: 'Închide căutările salvate', exact: true }).click()
  }
  panel = await openSearches(page)
  await page.evaluate(() => sessionStorage.setItem('qa-block-saved-writes', '1'))
  await panel.getByRole('button', { name: 'Șterge căutarea „Buget verificat”', exact: true }).click()
  await expect(panel.getByRole('alert')).toContainText('Ștergerea nu a reușit')
  await expect(panel.getByRole('heading', { name: 'Buget verificat', exact: true })).toBeVisible()
  await page.evaluate(() => sessionStorage.removeItem('qa-block-saved-writes'))
  await panel.getByRole('button', { name: 'Șterge căutarea „Buget verificat”', exact: true }).click()
  await expect(panel.getByRole('button', { name: 'Anulează ștergerea', exact: true })).toBeFocused()
  await page.evaluate(() => {
    const current = JSON.parse(localStorage.getItem('pm-saved-searches')!)
    current.push({ id: 'later', name: 'Salvată ulterior', filters: {}, createdAt: new Date().toISOString() })
    localStorage.setItem('pm-saved-searches', JSON.stringify(current))
    window.dispatchEvent(new StorageEvent('storage', { key: 'pm-saved-searches' }))
  })
  await panel.getByRole('button', { name: 'Anulează ștergerea', exact: true }).click()
  await expect(panel.getByRole('heading', { name: 'Buget verificat', exact: true })).toBeVisible()
  await expect(panel.getByRole('heading', { name: 'Salvată ulterior', exact: true })).toHaveCount(1)
  await panel.getByRole('button', { name: /^Șterge toate căutările/ }).click()
  await expect(panel.getByRole('heading', { name: 'Nicio căutare salvată', exact: true })).toBeVisible()
  await panel.getByRole('button', { name: 'Anulează ștergerea', exact: true }).click()
  await expect(panel.getByRole('list', { name: 'Căutări', exact: true }).locator(':scope > li')).toHaveCount(3)
  expect(errors).toEqual([])
})
