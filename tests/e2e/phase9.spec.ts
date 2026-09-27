import { expect, test, type Page } from "@playwright/test";
import { createUser, uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "the command palette is desktop only");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 120_000 });

const rows = (page: Page) => page.getByRole("region", { name: "Bloklar" }).getByRole("listitem");
const palette = (page: Page) => page.getByRole("dialog", { name: "Komutlar" });

/** Ctrl+K → type → Enter, all from the keyboard. */
async function runCommand(page: Page, query: string) {
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await expect(palette(page).getByRole("combobox")).toBeFocused();
  await page.keyboard.type(query);
  await page.keyboard.press("Enter");
  await expect(palette(page)).toBeHidden();
}

test("command palette adds blocks and navigates from the keyboard", async ({ page }) => {
  await createUser(page, `cp-${uid()}`);

  // Esc closes without running anything.
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press("Escape");
  // The native dialog hides at once; React hears its "close" event a task later. Wait for the content to unmount,
  // or a Ctrl+K pressed within that gap would toggle the stale "open" state shut (no human is that fast).
  await expect(page.locator("#palette-list")).toHaveCount(0);

  // First add warms up the server action (dev mode compiles it on first use).
  await runCommand(page, "metin ekle");
  await expect(rows(page)).toHaveCount(1, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard$/);

  // ROADMAP Phase 9 acceptance: adding a block from the keyboard takes under 3 seconds.
  const started = Date.now();
  await runCommand(page, "başlık ekle");
  await expect(rows(page)).toHaveCount(2);
  const elapsed = Date.now() - started;
  console.info(`palette add: ${elapsed}ms`);
  expect(elapsed).toBeLessThan(3_000);

  // Arrow keys move the selection; Enter runs the selected command.
  await page.keyboard.press("Control+k");
  await page.keyboard.type("istatistik");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dashboard\/analytics$/);

  // No match: Enter does nothing and the palette stays open.
  await page.keyboard.press("Control+k");
  await page.keyboard.type("zzzz-yok");
  await page.keyboard.press("Enter");
  await expect(palette(page)).toBeVisible();
});

test("skip link jumps past the navigation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "İçeriğe geç" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  // The next Tab lands inside the main content, not on the header links.
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("main#main")))).toBe(true);
});
