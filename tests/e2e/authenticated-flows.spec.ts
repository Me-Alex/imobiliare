import { expect, test } from "@playwright/test"

const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD
const clientEmail = process.env.PLAYWRIGHT_CLIENT_EMAIL
const clientPassword = process.env.PLAYWRIGHT_CLIENT_PASSWORD
const ownerEmail = process.env.PLAYWRIGHT_OWNER_EMAIL || clientEmail
const ownerPassword = process.env.PLAYWRIGHT_OWNER_PASSWORD || clientPassword

test("admin can open the command center", async ({ page }) => {
  test.skip(!adminPassword, "Set PLAYWRIGHT_ADMIN_PASSWORD to run admin E2E.")
  await page.goto("/admin/login")
  await page.getByPlaceholder("admin").fill(process.env.PLAYWRIGHT_ADMIN_USER || "admin")
  await page.getByPlaceholder("parola admin").fill(adminPassword!)
  await page.getByRole("button", { name: "Intra in admin" }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard/)
  await expect(page.getByRole("heading", { name: /Dashboard|HQS/i })).toBeVisible()
})

test("client portal loads authenticated workspace", async ({ page }) => {
  test.skip(!clientEmail || !clientPassword, "Set PLAYWRIGHT_CLIENT_EMAIL and PLAYWRIGHT_CLIENT_PASSWORD to run portal E2E.")
  await page.goto("/portal")
  await page.getByLabel("Email").fill(clientEmail!)
  await page.getByLabel("Parola").fill(clientPassword!)
  await page.getByRole("button", { name: "Intra in cont" }).click()
  await expect(page.getByRole("heading", { name: /Workspace personal/i })).toBeVisible()
})

test("owner portal loads owner-specific dashboard", async ({ page }) => {
  test.skip(!ownerEmail || !ownerPassword, "Set PLAYWRIGHT_OWNER_EMAIL and PLAYWRIGHT_OWNER_PASSWORD to run owner E2E.")
  await page.goto("/owner")
  await page.getByLabel("Email").fill(ownerEmail!)
  await page.getByLabel("Parola").fill(ownerPassword!)
  await page.getByRole("button", { name: "Intra in cont" }).click()
  await expect(page.getByRole("heading", { name: /Rapoarte si proprietati pentru proprietar/i })).toBeVisible()
})
