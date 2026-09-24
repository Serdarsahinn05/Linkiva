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

test.describe("landing and errors", () => {
  test.use({ locale: "tr-TR" });

  test("the claim bar carries the username into sign-up", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Kullanıcı adın").first().fill("deniz");
    await page.getByLabel("Kullanıcı adın").first().press("Enter");
    await expect(page).toHaveURL(/\/register\?username=deniz/);
  });

  test("unknown multi-segment URLs get a real, styled 404", async ({ page }) => {
    const res = await page.goto("/nope/nothing/here");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bu sayfa yok.");
  });
});
