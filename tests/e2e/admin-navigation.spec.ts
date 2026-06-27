import { expect, type Page, test } from "@playwright/test"

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login")
  await page.getByRole("textbox", { name: /email sau username admin/i }).fill("admin")
  await page.getByRole("textbox", { name: /parola/i }).fill("1234")
  await page.getByRole("button", { name: /intra in admin/i }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard/)
}

test.describe("admin navigation", () => {
  test("clicks through command center sidebar destinations", async ({ page }) => {
    await loginAsAdmin(page)

    const nav = page.getByRole("complementary")
    await expect(nav).toBeVisible()

    const destinations = [
      { label: /dashboard/i, view: "/admin/dashboard" },
      { label: /proprietati/i, view: "/admin/proprietati" },
      { label: /lead-uri/i, view: "/admin/leaduri" },
      { label: /clienti/i, view: "/admin/clienti" },
      { label: /programari/i, view: "/admin/programari" },
      { label: /agenti/i, view: "/admin/agenti" },
      { label: /seo/i, view: "/admin/seo" },
      { label: /analytics/i, view: "/admin/analytics" },
      { label: /setari/i, view: "/admin/setari" },
      { label: /continut/i, view: "/admin/continut" },
    ] as const

    for (const destination of destinations) {
      await test.step(`open ${destination.view}`, async () => {
        const link = nav.getByRole("link", { name: destination.label })
        await link.click()
        await expect(page).toHaveURL(new RegExp(`${destination.view}`))
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
      })
    }
  })

  test("platform route redirects to dashboard", async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto("/admin/platform")
    await expect(page).toHaveURL(/\/admin\/dashboard/)
  })
})
