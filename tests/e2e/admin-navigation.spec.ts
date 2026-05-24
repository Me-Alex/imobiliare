import { expect, type Page, test } from "@playwright/test"

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login")
  await page.getByRole("textbox", { name: /email sau username admin/i }).fill("admin")
  await page.getByRole("textbox", { name: /parola/i }).fill("1234")
  await page.getByRole("button", { name: /intra in admin/i }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard/)
  // Be resilient to the starting view changing via localStorage or query params.
  await expect(page.getByText("1@2.com")).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole("navigation", { name: /navigare admin/i })).toBeVisible({ timeout: 30_000 })
}

test.describe("admin navigation", () => {
  test("clicks through command center sidebar destinations", async ({ page }) => {
    await loginAsAdmin(page)

    const nav = page.getByRole("navigation", { name: /navigare admin/i })
    await expect(nav).toBeVisible()

    const destinations = [
      { label: /dashboard/i, view: "overview" },
      { label: /propriet/i, view: "properties" },
      { label: /lead-uri/i, view: "crm" },
      { label: /pipeline/i, view: "transactions" },
      { label: /vizion/i, view: "appointments" },
      { label: /agen/i, view: "agents" },
      { label: /rapoarte/i, view: "reports" },
      { label: /set/i, view: "settings" },
    ] as const

    for (const destination of destinations) {
      await test.step(`open ${destination.view}`, async () => {
        const button = nav.getByRole("button", { name: destination.label })
        await button.click()
        await expect(page).toHaveURL(new RegExp(`[?&]view=${destination.view}(?:&|$)`))
        // There should be a view header rendered for each page.
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
        await expect(button).toHaveClass(/active/)
      })
    }
  })

  test("platform route resolves to the admin platform marker", async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto("/admin/platform")
    await expect(page).toHaveURL(/\/admin\/dashboard/)
    await expect(page.getByText("1@2.com")).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole("heading", { name: /backend live/i })).toBeVisible()
  })
})
