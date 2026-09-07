import { test, expect } from '@playwright/test'

const accounts: Record<string, string> = JSON.parse(process.env.AUTH_SMOKE_ACCOUNTS || '{}')
for (const role of ['CLIENT', 'OWNER', 'AGENT', 'ADMIN']) {
  test(`${role} chooses a dossier and opens one document operation at a time`, async ({ page }) => {
    test.setTimeout(180_000)
    test.skip(!accounts[role] || !process.env.AUTH_SMOKE_PASSWORD, 'Dedicated demo credentials required.')
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/?page=login')
    await page.getByLabel('Email', { exact: true }).fill(accounts[role])
    await page.getByLabel('Parola', { exact: true }).fill(process.env.AUTH_SMOKE_PASSWORD!)
    const loginResponse = page.waitForResponse(response => response.url().includes('/auth/v1/token'))
    await page.getByRole('button', { name: 'Autentifică-te', exact: true }).click()
    const actorId = (await (await loginResponse).json()).user.id
    await expect(page).toHaveURL(/page=dashboard/)
    const cookies = page.getByRole('button', { name: 'Doar necesare', exact: true })
    if (await cookies.isVisible()) await cookies.click()
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/?page=documente')
      const chooser = page.getByRole('region', { name: 'Alege dosarul' })
      await expect(chooser).toBeVisible()
      await expect(page.getByTestId('document-action-center')).toHaveCount(0)
      await chooser.getByRole('button').first().click()
      await expect(page.getByTestId('document-action-center')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Documentele dosarului', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Încarcă un fișier', exact: true }).click()
      await expect(page.getByRole('dialog')).toHaveCount(1)
      await expect(page.getByRole('dialog')).toContainText('Alege tipul actului')
      await expect(page.getByRole('dialog').getByText('Generează alt document', { exact: true })).toHaveCount(0)
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: 'Date trimise agentului', exact: true }).click()
      await expect(page.getByRole('dialog')).toHaveCount(1)
      await expect(page.getByRole('dialog').getByRole('heading', { name: 'Date trimise agentului', exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
      if (role === 'AGENT' || role === 'ADMIN') {
        await page.getByRole('button', { name: 'Pregătește un document', exact: true }).click()
        await expect(page.getByRole('dialog')).toHaveCount(1)
        await expect(page.getByRole('dialog').getByText('Generează alt document', { exact: true })).toBeVisible()
        await page.keyboard.press('Escape')
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `tool-results/documents-simple-${role}-${width}.png`, fullPage: true, animations: 'disabled' })
      await page.getByRole('button', { name: 'Schimbă dosarul', exact: true }).click()
      await expect(chooser).toBeVisible()
      await expect(page.getByTestId('document-action-center')).toHaveCount(0)
    }
    if (role === 'CLIENT') {
      await page.route('**/rest/v1/client_documents?**', route => route.fulfill({ json: [] }))
      await page.route('**/rest/v1/legal_document_requests?**', route => route.fulfill({ json: [] }))
      await page.getByRole('region', { name: 'Alege dosarul' }).getByRole('button').first().click()
      await expect(page.getByTestId('document-action-center')).toBeVisible()
      await page.getByTestId('document-action-center').getByRole('button').click()
      await expect(page.getByRole('dialog')).toHaveCount(1)
      await expect(page.getByRole('dialog')).toContainText('Completează câmpurile obligatorii')
      await expect(page.getByRole('dialog').getByRole('status')).toContainText('câmpuri obligatorii')
      await expect(page.getByLabel('Observații pentru agent', { exact: true })).toBeHidden()
      await page.getByText('Informații suplimentare (opțional)', { exact: true }).click()
      await expect(page.getByLabel('Observații pentru agent', { exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
      const appointmentId = new URL(page.url()).searchParams.get('appointment')
      await page.unroute('**/rest/v1/client_documents?**')
      await page.route('**/rest/v1/client_documents?**', route => route.fulfill({ json: [{
        id: 'test-document', appointment_id: appointmentId, user_id: actorId,
        title: 'Fișă de vizionare pentru test', type: 'viewing_report', status: 'READY_TO_SIGN',
        signature_requirement: 'SIMPLE', storage_path: 'test.png', mime_type: 'image/png',
        created_at: new Date().toISOString(),
        document_signers: [{ id: 'test-signer', user_id: actorId, signer_role: 'CLIENT', status: 'PENDING', required: true }],
      }] }))
      await page.route('**/storage/v1/object/sign/**', route => route.request().method() === 'POST'
        ? route.fulfill({ json: { signedURL: '/object/sign/client-documents/test.png?token=test' } })
        : route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=', 'base64') }))
      await page.reload()
      await page.getByTestId('document-action-center').getByRole('button', { name: 'Verifică și semnează' }).click()
      await expect(page.getByRole('heading', { name: 'Confirmă semnătura', exact: true })).toHaveCount(0)
      await expect(page.getByRole('dialog').getByRole('img', { name: 'Fișă de vizionare pentru test', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Continuă la semnare', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Confirmă semnătura', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Confirmă și semnează', exact: true })).toBeDisabled()
      await page.keyboard.press('Escape')
      await page.unroute('**/rest/v1/client_documents?**')
      await page.unroute('**/rest/v1/legal_document_requests?**')
    }
    await page.goto('/?page=documente&appointment=00000000-0000-0000-0000-000000000000')
    await expect(page.getByRole('alert').filter({ hasText: 'Dosarul din link nu este disponibil' })).toBeVisible()
    await expect(page.getByTestId('document-action-center')).toHaveCount(0)
    await page.getByRole('region', { name: 'Alege dosarul' }).getByRole('button').first().click()
    await expect(page.getByTestId('document-action-center')).toBeVisible()
    const dossierUrl = page.url()
    await page.route('**/rest/v1/legal_document_requests?**', route => route.fulfill({ status: 500, json: { message: 'Test unavailable' } }))
    await page.goto(dossierUrl)
    await expect(page.getByRole('alert').filter({ hasText: 'Datele trimise agentului nu au putut fi încărcate' })).toBeVisible()
    await expect(page.getByTestId('document-action-center')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Încarcă un fișier', exact: true })).toHaveCount(0)
    expect(errors).toEqual([])
  })
}
