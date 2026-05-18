import { expect, test } from "@playwright/test"

test("properties page filters through server search", async ({ page }) => {
  await page.goto("/proprietati?zone=Pipera&tip=APARTMENT")
  await expect(page.getByRole("heading", { name: "Proprietati disponibile" })).toBeVisible()
  await expect(page.getByText(/rezultat/i)).toBeVisible()
})

test("lead form can be opened and validated", async ({ page }) => {
  await page.goto("/contact")
  await expect(page.getByRole("heading", { name: /Contact/i })).toBeVisible()
  await page.getByRole("button", { name: /Trimite|Solicita|Contact/i }).first().click()
  await expect(page.locator("body")).toContainText(/obligatoriu|invalid|telefon|email/i)
})

test("admin login page accepts username alias", async ({ page }) => {
  await page.goto("/admin/login")
  await page.getByPlaceholder("admin").fill("admin")
  await page.getByPlaceholder("parola admin").fill("1234")
  await page.getByRole("button", { name: "Intra in admin" }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard/)
  await expect(page.getByText("admin@hqsimobiliare.ro")).toBeVisible()
})
