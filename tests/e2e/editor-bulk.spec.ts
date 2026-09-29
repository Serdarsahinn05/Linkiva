import { expect, test, type Page } from "@playwright/test";
import { createUser, uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 90_000 });

const rows = (page: Page) => page.getByRole("region", { name: "Bloklar" }).getByRole("listitem");

test("a template comes back out in one step, and everything goes after a confirmation, with undo", async ({ page }) => {
  await createUser(page, `bulk-${uid()}`);

  // A template's blocks can be taken back from its toast.
  await page.getByRole("button", { name: "Öğrenci" }).click();
  await expect(rows(page)).toHaveCount(5);
  await page.getByRole("button", { name: "Geri al" }).click();
  await expect(page.getByText("Şablon geri alındı.")).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  await page.reload();
  await expect(rows(page)).toHaveCount(0);

  // "Delete all" asks first; cancelling keeps everything.
  await page.getByRole("button", { name: "Geliştirici" }).click();
  await expect(page.getByRole("button", { name: "Tümünü sil" })).toBeVisible();
  const count = await rows(page).count();
  expect(count).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Tümünü sil" }).click();
  const dialog = page.getByRole("dialog", { name: "Bütün bloklar silinsin mi?" });
  await expect(dialog).toContainText(`${count} blok`);
  await dialog.getByRole("button", { name: "Vazgeç" }).first().click();
  await expect(rows(page)).toHaveCount(count);

  // Confirmed, they all go; the toast brings them back in their order.
  await page.getByRole("button", { name: "Tümünü sil" }).click();
  await dialog.getByRole("button", { name: "Hepsini sil" }).click();
  await expect(rows(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Geri al" }).click();
  await expect(rows(page)).toHaveCount(count);
  await page.reload();
  await expect(rows(page)).toHaveCount(count);
});
