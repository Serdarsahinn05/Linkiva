import { expect, test } from "@playwright/test";
import { createUser, uid } from "./helpers";

test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 90_000 });

test("the getting started card ticks itself from the page and stays closed once closed", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "one run is enough; the mobile hint has its own test");
  await createUser(page, `g-${uid()}`);

  const guide = page.getByRole("region", { name: "İlk adımlar" });
  await expect(guide).toBeVisible();
  const progress = guide.getByRole("progressbar");
  await expect(progress).toHaveAttribute("aria-valuenow", "0");

  // The step's button leads to the field that does it; adding a link there ticks it.
  await guide.getByRole("button", { name: "Link yapıştır" }).click();
  await expect(page.getByRole("textbox", { name: "Link yapıştır" })).toBeFocused();
  await page.keyboard.type("https://example.com/portfolio");
  await page.keyboard.press("Enter");
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await expect(guide.getByRole("button", { name: "Link yapıştır" })).toHaveCount(0);

  // "Shared" is never ticked by a click: only a real visitor does that.
  await guide.getByRole("button", { name: "Adresi kopyala" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "1");

  // Closed is kept on the account.
  await guide.getByRole("button", { name: "İlk adımlar kartını kapat" }).click();
  await expect(guide).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sayfan", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "İlk adımlar" })).toHaveCount(0);

  // The keyboard hint beside search goes once the palette has been opened.
  const hint = page.getByRole("note").filter({ hasText: "her şeye klavyeden ulaş" });
  await expect(hint).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Escape");
  await expect(hint).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sayfan", level: 1 })).toBeVisible();
  await expect(page.getByRole("note")).toHaveCount(0);
});

test("the tab bar hint shows once on a phone", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "the tab bar exists only on narrow screens");
  await createUser(page, `t-${uid()}`);
  const hint = page.getByRole("note").filter({ hasText: "Sayfanın ziyaretçiye nasıl göründüğüne" });
  await expect(hint).toBeVisible();
  await hint.getByRole("button", { name: "Anladım" }).click();
  await expect(hint).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sayfan", level: 1 })).toBeVisible();
  await expect(page.getByRole("note")).toHaveCount(0);
});
