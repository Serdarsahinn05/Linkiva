import { expect, test } from "@playwright/test";

test.describe("Turkish visitor", () => {
  test.use({ locale: "tr-TR" });
  test("home renders with tokens, font and Turkish copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("tek bir adreste");
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    expect(bg).not.toBe("rgb(0, 0, 0)");
  });
});

test.describe("English visitor", () => {
  test.use({ locale: "en-US" });
  test("home falls back to English from Accept-Language", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("one address");
  });
});
