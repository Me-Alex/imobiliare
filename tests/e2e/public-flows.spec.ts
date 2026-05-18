import { expect, test } from "@playwright/test"

test("properties page filters through server search", async ({ page }) => {
  await page.goto("/proprietati?zone=Pipera&tip=APARTMENT")
  await expect(page.getByRole("heading", { name: "Proprietati disponibile" })).toBeVisible()
  await expect(page.getByText(/rezultat/i)).toBeVisible()
})

test("lead form can be opened and validated", async ({ page }) => {
  await page.goto("/contact")
  await expect(page.getByRole("heading", { name: /Spune-ne|Contact/i })).toBeVisible()
  await expect(page.getByLabel(/Nume complet/i)).toBeVisible()
  await expect(page.getByLabel(/Telefon/i)).toBeVisible()
  await expect(page.getByRole("button", { name: /Trimite cererea|Trimite|Solicita/i }).first()).toBeVisible()
})

test("owner portal and programmatic SEO routes render", async ({ page }) => {
  await page.goto("/owner")
  await expect(page.getByRole("heading", { name: /Cont client securizat|Rapoarte si proprietati/i })).toBeVisible()

  await page.goto("/zone/pipera/apartamente")
  await expect(page.getByRole("heading", { name: /Apartamente in Pipera/i })).toBeVisible()
})

test("admin login page accepts username alias", async ({ page }) => {
  test.skip(!process.env.PLAYWRIGHT_ADMIN_PASSWORD, "Set PLAYWRIGHT_ADMIN_PASSWORD to run authenticated admin E2E.")
  await page.goto("/admin/login")
  await page.getByPlaceholder("admin").fill(process.env.PLAYWRIGHT_ADMIN_USER || "admin")
  await page.getByPlaceholder("parola admin").fill(process.env.PLAYWRIGHT_ADMIN_PASSWORD!)
  await page.getByRole("button", { name: "Intra in admin" }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard/)
  await expect(page.getByText(process.env.PLAYWRIGHT_ADMIN_EMAIL || "admin@hqsimobiliare.ro")).toBeVisible()
})
