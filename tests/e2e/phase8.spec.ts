import { expect, test, type Page } from "@playwright/test";
import { createUser, uid, visitorIp } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 120_000 });

// First use of a server action compiles it in dev mode; allow for that.
const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible({ timeout: 30_000 });
const rows = (page: Page) => page.getByRole("region", { name: "Bloklar" }).getByRole("listitem");
/** Adds a block and waits for its row (new blocks go on top), so fields are never filled into the previous row. */
async function add(page: Page, type: string) {
  const before = await rows(page).count();
  await page.getByRole("button", { name: `${type} ekle` }).click();
  await expect(rows(page)).toHaveCount(before + 1);
}

test("contact and support blocks reach the public page with server-built targets", async ({ page, browser, request }) => {
  const username = `tr-${uid()}`;
  await createUser(page, username);

  // New blocks go on top, so the fold goes in first: a foldable header with a link under it, at the bottom.
  await add(page, "Link");
  await page.getByLabel("Başlık", { exact: true }).first().fill("Gizli link");
  await page.getByLabel("Adres").first().fill("example.com/gizli");
  await add(page, "Başlık");
  await page.getByLabel("Başlık metni").fill("Diğer linkler");
  await page.getByRole("switch", { name: "Altındakileri katla" }).click();

  await add(page, "WhatsApp");
  await page.getByLabel("Telefon numarası").fill("0532 123 45 67");
  await page.getByLabel("Hazır mesaj (isteğe bağlı)").fill("Merhaba, sayfandan geldim");

  await add(page, "Kartvizit");
  await page.getByLabel("Ad soyad").fill("Ayşe Yılmaz");
  await page.getByLabel("E-posta", { exact: true }).fill("ayse@example.com");

  await add(page, "Destek");
  await page.getByLabel("Hesap sahibinin adı").fill("Ayşe Yılmaz");
  await page.getByLabel("IBAN", { exact: true }).fill("tr33 0006 1005 1978 6457 8413 26");

  await add(page, "Geri sayım");
  await rows(page).first().getByLabel("Başlık", { exact: true }).fill("Konser başlıyor");
  await page.getByLabel("Tarih ve saat").fill(`${new Date().getFullYear() + 1}-06-01T20:00`);

  await saved(page);

  // Public page, as a visitor without JavaScript.
  const visitor = await browser.newContext({ javaScriptEnabled: false, locale: "tr-TR", extraHTTPHeaders: { "x-forwarded-for": visitorIp() } });
  const pub = await visitor.newPage();
  await pub.goto(`/${username}`);
  await expect(pub.getByText("TR33 0006 1005 1978 6457 8413 26")).toBeVisible();
  await expect(pub.getByText("Konser başlıyor")).toBeVisible();
  await expect(pub.locator("time")).toContainText(String(new Date().getFullYear() + 1));
  // Folded until opened; works without JS.
  await expect(pub.getByRole("link", { name: "Gizli link" })).toBeHidden();
  await pub.getByText("Diğer linkler").click();
  await expect(pub.getByRole("link", { name: "Gizli link" })).toBeVisible();

  // WhatsApp: the redirect is rebuilt from the normalised number.
  const whatsappHref = await pub.getByRole("link", { name: "WhatsApp'tan yaz" }).getAttribute("href");
  const redirect = await request.get(whatsappHref!, { maxRedirects: 0 });
  expect(redirect.status()).toBe(302);
  expect(redirect.headers().location).toBe(`https://wa.me/905321234567?text=${encodeURIComponent("Merhaba, sayfandan geldim")}`);

  // Contact: a vCard download.
  const contactHref = await pub.getByRole("link", { name: /Rehbere ekle/ }).getAttribute("href");
  const vcard = await request.get(contactHref!);
  expect(vcard.headers()["content-type"]).toContain("text/vcard");
  expect(vcard.headers()["content-disposition"]).toContain('filename="ayse-yilmaz.vcf"');
  expect(await vcard.text()).toContain("EMAIL;TYPE=INTERNET:ayse@example.com");
  await visitor.close();
});
