import { test, expect } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { getLegalDocumentDefinition } from '../src/lib/legal-documents'

test.use({ actionTimeout: 15_000 })

const accounts: Record<string, string> = JSON.parse(process.env.AUTH_SMOKE_ACCOUNTS || '{}')

test('staff reviews and creates the edited draft with safe context refresh', async ({ page }) => {
  test.setTimeout(240_000)
  test.skip(!accounts.ADMIN || !process.env.AUTH_SMOKE_PASSWORD, 'Dedicated demo credentials required.')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?page=login')
  await page.getByLabel('Email', { exact: true }).fill(accounts.ADMIN)
  await page.getByLabel('Parola', { exact: true }).fill(process.env.AUTH_SMOKE_PASSWORD!)
  await page.getByRole('button', { name: 'Autentifică-te', exact: true }).click()
  await expect(page).toHaveURL(/page=dashboard/)
  const cookies = page.getByRole('button', { name: 'Doar necesare', exact: true })
  if (await cookies.isVisible()) await cookies.click()
  const definition = getLegalDocumentDefinition('rental_contract')
  let templateVersion = 1
  let clientName = 'Client inițial'
  let uploaded = 0
  let saved: Record<string, unknown> | null = null
  const blockedWrites: string[] = []
  // All document mutations are intercepted: no test draft reaches a real dossier.
  await page.route('**/rest/v1/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/').pop()
    if (table === 'get_coin_account') return route.fulfill({ json: [] })
    if (request.method() !== 'GET') {
      if (table === 'client_documents' && request.method() === 'POST') {
        saved = request.postDataJSON()
        return route.fulfill({ json: { ...saved, created_at: new Date().toISOString() } })
      }
      blockedWrites.push(`${request.method()} ${table}`)
      return route.abort()
    }
    if (table === 'legal_document_requests' || table === 'client_documents') return route.fulfill({ json: [] })
    if (table === 'admin_document_templates') return route.fulfill({ json: {
      id: 'draft-template', name: 'Test rental template', type: 'rental_contract', version: templateVersion,
      legal_version: String(templateVersion), legal_review_status: 'REVIEW_REQUIRED', signature_requirement: 'ADVANCED_OR_QUALIFIED', required_fields: definition.fields.filter(field => field.required).map(field => field.key),
      body: 'CONTRACT DE TEST\nReferință: {{document_reference}}\n' + definition.fields.map(field => `${field.label}: {{${field.key}}}`).join('\n'),
    } })
    if (table === 'agency_legal_profiles') return route.fulfill({ json: { id: 'agency', status: 'ACTIVE', legal_name: 'Agenție test', cui: '12345', trade_registry_number: 'J40/test', registered_office: 'Adresă test', email: 'agency@example.test', phone: '0700000000', representative_name: 'Reprezentant test', representative_capacity: 'Administrator', privacy_notice_url: 'https://example.test/privacy', privacy_notice_version: '1' } })
    if (table === 'appointments' && url.searchParams.has('id') && url.searchParams.get('select')?.includes('checked_in_at,completed_at')) return route.fulfill({ json: {
      id: url.searchParams.get('id')?.slice(3), client_name: clientName, client_email: 'client@example.test', client_phone: '0700000000',
      properties: { id: 'property', title: 'Proprietate test', address: 'Adresă test', transaction_type: 'RENT', price: 500, currency: 'EUR', profiles: { full_name: 'Proprietar test', email: 'owner@example.test', phone: '0700000001' } },
    } })
    return route.fallback()
  })
  await page.route('**/storage/v1/**', async route => {
    if (route.request().method() === 'GET') return route.fallback()
    if (route.request().method() === 'POST' && route.request().url().includes('/object/client-documents/')) {
      uploaded++
      const body = route.request().postDataBuffer()!
      const start = body.indexOf(Buffer.from('%PDF-'))
      const end = body.lastIndexOf(Buffer.from('%%EOF'))
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeGreaterThan(start)
      await writeFile('tool-results/reviewed-draft.pdf', body.subarray(start, end + 5))
      return route.fulfill({ json: { Key: 'test-only' } })
    }
    blockedWrites.push(`storage ${route.request().method()}`)
    return route.abort()
  })
  await page.goto('/?page=documente')
  await page.getByRole('region', { name: 'Alege dosarul' }).getByRole('button').first().click()
  await page.getByRole('button', { name: /^(Pregătește un document|Alege documentul de pregătit)$/ }).click()
  await page.getByRole('button', { name: /^Contract de închiriere/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Contract de închiriere', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('#legal-field-client_name')).toHaveValue('Client inițial')
  await expect(dialog.locator('#legal-field-owner_payment_account')).toHaveValue('')
  await dialog.getByRole('button', { name: 'Verifică textul', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Verifică')
  await dialog.locator('#legal-field-client_phone').fill('0712345678')
  clientName = 'Client actualizat'
  await dialog.getByText('Date din dosar și șablon', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Actualizează datele din dosar', exact: true }).click()
  await expect(dialog.locator('#legal-field-client_name')).toHaveValue('Client actualizat')
  await expect(dialog.locator('#legal-field-client_phone')).toHaveValue('0712345678')
  for (const field of definition.fields.filter(field => !field.readOnly)) {
    const control = dialog.locator(`#legal-field-${field.key}`)
    const value = field.key === 'client_name' ? 'Ștefan Țîrlea' : field.type === 'email' ? 'person@example.test' : field.type === 'date' ? field.key.includes('end') ? '2027-09-09' : '2026-09-09' : field.type === 'number' ? '5' : field.key === 'rent_amount' ? '1.250,50' : field.key === 'deposit_amount' ? '0' : 'Date verificate'
    if (field.type === 'select') await control.selectOption(field.options![0].value)
    else await control.fill(value)
  }
  await dialog.locator('#legal-field-rent_amount').fill('-100')
  await dialog.getByRole('button', { name: 'Verifică textul', exact: true }).click()
  await expect(dialog.locator('#legal-field-rent_amount')).toHaveAttribute('aria-invalid', 'true')
  await dialog.locator('#legal-field-rent_amount').fill('1.250,50')
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 })
    await dialog.getByRole('button', { name: 'Verifică textul', exact: true }).click()
    await expect(dialog.getByRole('article', { name: 'Textul documentului' })).toContainText('Ștefan Țîrlea')
    await expect(dialog.getByRole('article', { name: 'Textul documentului' })).toContainText('1.250,50')
    await expect.poll(() => dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    await expect(dialog.getByRole('button', { name: 'Creează ciorna în dosar', exact: true })).toBeInViewport()
    await page.screenshot({ path: `tool-results/document-draft-review-${width}.png` })
    if (width === 320) {
      await page.keyboard.press('Escape')
      const discard = page.getByRole('alertdialog', { name: 'Renunți la modificări?' })
      await expect(discard).toBeVisible()
      await discard.getByRole('button', { name: 'Continuă redactarea', exact: true }).click()
      await expect(discard).toBeHidden()
      await expect(dialog.getByRole('heading', { name: 'Verifică documentul', exact: true })).toBeFocused()
    }
    if (width !== 320) await dialog.getByRole('button', { name: 'Înapoi la date', exact: true }).click()
  }
  templateVersion = 2
  await dialog.getByRole('button', { name: 'Creează ciorna în dosar', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('s-au schimbat')
  expect(uploaded).toBe(0)
  await dialog.getByRole('button', { name: 'Actualizează datele dosarului', exact: true }).click()
  await expect(dialog.locator('#legal-field-client_name')).toHaveValue('Ștefan Țîrlea')
  await dialog.getByRole('button', { name: 'Verifică textul', exact: true }).click()
  const review = await dialog.getByRole('article', { name: 'Textul documentului' }).innerText()
  await dialog.getByRole('button', { name: 'Creează ciorna în dosar', exact: true }).click()
  await expect(dialog).toBeHidden()
  expect(uploaded).toBe(1)
  expect(saved).not.toBeNull()
  const data = (saved as unknown as { document_data: Record<string, string> }).document_data
  expect(review).toContain(data.document_reference)
  expect(data.client_name).toBe('Ștefan Țîrlea')
  expect(data.rent_amount).toBe('1.250,50')
  expect(blockedWrites).toEqual([])
  expect(errors).toEqual([])
})
