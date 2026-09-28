import { expect, test } from "@playwright/test";
import { createUser, uid } from "./helpers";

test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 90_000 });

test("a slow page change dims the page and runs the top line until the next page is in", async ({ page, isMobile }) => {
  await createUser(page, `ld-${uid()}`);
  const main = page.locator("main#main");
  const line = page.locator(".nav-progress");

  // Hold the next page's response for a moment, as a cold server would.
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/dashboard\/settings/, async (route) => {
    await held;
    await route.continue();
  });

  const nav = page.getByRole("navigation", { name: "Panel menüsü" }).filter({ visible: true });
  await nav.getByRole("link", { name: "Ayarlar" }).click();
  await expect(main).toHaveAttribute("data-navigating", "true");
  await expect(main).toHaveAttribute("aria-busy", "true");
  await expect(line).toHaveAttribute("data-active", "true");
  // The cue is visible only after its delay (a quick change shows nothing).
  await expect.poll(() => main.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(0.8);
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/nav-pending-${isMobile ? "mobile" : "desktop"}.png` });

  release();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
  await expect(page.getByRole("heading", { level: 1, name: "Ayarlar" })).toBeVisible();
  await expect(main).not.toHaveAttribute("data-navigating");
  await expect(line).not.toHaveAttribute("data-active");
  await expect.poll(() => main.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);

  // Clicking the page that is already open starts nothing.
  await nav.getByRole("link", { name: "Ayarlar" }).click();
  await expect(main).not.toHaveAttribute("data-navigating");
  if (isMobile) return;

  // Analytics streams its figures: the header and range tabs, then the numbers; a new range swaps only that part.
  await page.unroute(/\/dashboard\/settings/);
  await page.goto("/dashboard/analytics");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Henüz ziyaret yok", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "7 gün" }).click();
  await expect(page).toHaveURL(/range=7d/);
  await expect(page.getByRole("link", { name: "7 gün" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("status")).toHaveCount(0);
});
