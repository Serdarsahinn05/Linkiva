import { expect, test, type Page } from "@playwright/test";
import { createUser, uid, visitorIp } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 90_000 });

// First use of a server action compiles it in dev mode; allow for that.
const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible({ timeout: 30_000 });

test("a renamed page keeps its old address working", async ({ page, request }) => {
  const oldName = `ren-${uid()}`;
  const newName = `${oldName}.yeni`;
  await createUser(page, oldName);
  // Visit once so the old address is in the page cache before the rename.
  expect((await request.get(`/${oldName}`)).status()).toBe(200);

  await page.goto("/dashboard/settings");
  await page.getByLabel("Kullanıcı adı").fill(newName);
  await expect(page.getByText(`${newName} boşta.`)).toBeVisible();
  await page.getByRole("button", { name: "Adresi değiştir" }).click();
  await expect(page.getByText(`Adresin artık`)).toBeVisible({ timeout: 30_000 });

  // Old address: permanent redirect to the new one. New address: the page.
  const moved = await request.get(`/${oldName}`, { maxRedirects: 0 });
  expect(moved.status()).toBe(308);
  expect(moved.headers().location).toMatch(new RegExp(`/${newName.replace(".", "\\.")}$`));
  expect((await request.get(`/${newName}`)).status()).toBe(200);

  // The old name stays reserved for its owner: nobody else sees it as free.
  await page.context().clearCookies();
  await createUser(page, `ren2-${uid()}`);
  await page.goto("/dashboard/settings");
  await page.getByLabel("Kullanıcı adı").fill(oldName);
  await expect(page.getByText(`${oldName} alınmış.`)).toBeVisible();
});

test.describe("without JavaScript", () => {
  test("the subscribe form still works", async ({ page, browser }) => {
    const username = `nojs-${uid()}`;
    await createUser(page, username);
    await page.getByRole("button", { name: "E-posta ekle" }).click();
    await page.getByLabel("Başlık (isteğe bağlı)").fill("Bültenime katıl");
    await saved(page);

    const visitor = await browser.newContext({ javaScriptEnabled: false, locale: "tr-TR", extraHTTPHeaders: { "x-forwarded-for": visitorIp() } });
    const noJs = await visitor.newPage();
    await noJs.goto(`/${username}`);
    await expect(noJs.getByText("Bültenime katıl")).toBeVisible();
    const email = `nojs-fan-${uid()}@example.com`;
    await noJs.getByLabel("E-posta adresin").fill(email);
    await noJs.getByRole("button", { name: "Abone ol" }).click();
    await expect(noJs.getByText("Teşekkürler, listedesin.")).toBeVisible();
    await visitor.close();

    await page.goto("/dashboard/audience");
    await expect(page.getByText(email)).toBeVisible();
  });
});
