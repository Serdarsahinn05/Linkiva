import { expect, test, type Page } from "@playwright/test";
import { createUser, uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 90_000 });

const rows = (page: Page) => page.getByRole("region", { name: "Bloklar" }).getByRole("listitem");

test("templates start as drafts that never publish", async ({ page, request }) => {
  const username = `tpl-${uid()}`;
  await createUser(page, username);

  await page.getByRole("button", { name: "Öğrenci" }).click();
  await expect(rows(page)).toHaveCount(5);
  await expect(page.getByText("Tamamlanmadı, sayfanda görünmüyor.")).toHaveCount(4);

  // Only the header is public until the owner fills the addresses in.
  const html = await (await request.get(`/${username}`)).text();
  expect(html).toContain("Projeler");
  expect(html).not.toContain("Özgeçmişim");
});

test("a pasted link becomes the right block", async ({ page, request }) => {
  const username = `paste-${uid()}`;
  await createUser(page, username);
  const field = page.getByLabel("Link yapıştır");

  // A YouTube address becomes a player, and one tap turns it back into a link.
  await field.fill("https://youtu.be/dQw4w9WgXcQ");
  await field.press("Enter");
  // First use of a server action compiles it in dev mode; allow for that.
  await expect(page.getByText("Oynatıcı olarak eklendi.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Video ya da müzik linki")).toHaveValue("https://youtu.be/dQw4w9WgXcQ");
  await page.getByRole("button", { name: "Link olarak ekle" }).click();
  await expect(page.getByLabel("Video ya da müzik linki")).toHaveCount(0);
  await expect(rows(page)).toHaveCount(1);

  // Any other address becomes a link titled with its host, public right away.
  await field.fill("github.com/linkiva");
  await field.press("Enter");
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByLabel("Başlık", { exact: true }).first()).toHaveValue("github.com");
  // Public links go through /l/<id> (click counting), so the page shows the title, not the address.
  await expect.poll(async () => (await (await request.get(`/${username}`)).text()).includes(">github.com<")).toBe(true);

  // Text that is not an address is refused without adding anything.
  await field.fill("merhaba dünya");
  await field.press("Enter");
  await expect(page.getByText("Bu adresi açamayız.")).toBeVisible();
  await expect(rows(page)).toHaveCount(2);
});

test("the import dialog only reads supported pages", async ({ page }) => {
  await createUser(page, `imp-${uid()}`);
  await page.getByRole("button", { name: "Linktree ya da GitHub'dan al" }).click();
  const dialog = page.getByRole("dialog", { name: "İçe aktar" });
  await dialog.getByLabel("Linktree ya da GitHub adresin").fill("example.com/someone");
  await dialog.getByRole("button", { name: "Sayfayı oku" }).click();
  await expect(dialog.getByText("Şimdilik yalnızca linktr.ee ve github.com profil adreslerini okuyabiliyoruz.")).toBeVisible();

  // Pasting a linktr.ee address in the editor offers the import with the address filled in.
  await dialog.getByRole("button", { name: "Kapat" }).click();
  const field = page.getByLabel("Link yapıştır");
  await field.fill("linktr.ee/someone");
  await field.press("Enter");
  await expect(page.getByRole("dialog", { name: "İçe aktar" }).getByLabel("Linktree ya da GitHub adresin")).toHaveValue("https://linktr.ee/someone");

  // A pasted GitHub profile is a link to it, not an import (repositories are imported from the dialog).
  await page.getByRole("dialog", { name: "İçe aktar" }).getByRole("button", { name: "Kapat" }).click();
  await field.fill("github.com/someone");
  await field.press("Enter");
  await expect(page.getByRole("dialog", { name: "İçe aktar" })).toBeHidden();
  await expect(page.locator('input[value="https://github.com/someone"]')).toBeVisible();
});
