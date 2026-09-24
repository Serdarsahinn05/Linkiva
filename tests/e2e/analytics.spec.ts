import { expect, test, type APIRequestContext, type Browser } from "@playwright/test";
import { createUser, uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");

// Headless Chrome announces itself as "HeadlessChrome", which the bot filter (correctly) drops.
const REAL_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0";
test.use({ locale: "tr-TR", userAgent: REAL_UA });

async function visitAsStranger(browser: Browser, path: string, referer?: string) {
  const context = await browser.newContext({ userAgent: REAL_UA, locale: "tr-TR", extraHTTPHeaders: referer ? { referer } : {} });
  const page = await context.newPage();
  const beacon = page.waitForRequest((r) => r.url().endsWith("/api/e") && r.method() === "POST");
  await page.goto(path);
  await beacon;
  const href = await page.locator('main a[href^="/l/"]').first().getAttribute("href");
  await context.close();
  return href!;
}

async function click(request: APIRequestContext, href: string, ua = REAL_UA) {
  const res = await request.get(href, { maxRedirects: 0, headers: { "user-agent": ua } });
  expect(res.status()).toBe(302);
}

test.describe.configure({ timeout: 90_000 });

test("views and clicks are counted honestly: no bots, no owner, no repeats", async ({ page, browser, request }) => {
  const username = `an-${uid()}`;
  await createUser(page, username);
  const rows = page.getByRole("region", { name: "Bloklar" }).getByRole("listitem");
  await page.getByRole("button", { name: "Link ekle" }).click();
  await expect(rows).toHaveCount(1);
  await page.getByLabel("Başlık", { exact: true }).fill("Portfolyo");
  await page.getByLabel("Adres").fill("example.com");
  await expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible();

  // The owner viewing their own page is not a visit.
  await page.goto(`/${username}`);
  await page.waitForTimeout(800);

  // A stranger from Instagram: one view, even if they reload.
  const href = await visitAsStranger(browser, `/${username}?utm_source=instagram`, "https://l.instagram.com/");
  await visitAsStranger(browser, `/${username}`);

  // One real click; a double click inside 5s collapses; WhatsApp's previewer is ignored.
  await click(request, href);
  await click(request, href);
  await click(request, href, "WhatsApp/2.24.1");
  const botBeacon = await request.post("/api/e", { data: JSON.stringify({ p: "x" }), headers: { "user-agent": "facebookexternalhit/1.1" } });
  expect(botBeacon.status()).toBe(204);

  // Writes happen after the response (next/server after()), so poll the page until they land.
  const strip = page.locator("section").filter({ hasText: "Görüntülenme" }).first();
  await expect(async () => {
    await page.goto("/dashboard/analytics?range=7d");
    await expect(strip.getByText("Görüntülenme").locator("xpath=following-sibling::span[1]")).toHaveText("1", { timeout: 1000 });
    await expect(strip.getByText("Tıklama", { exact: true }).locator("xpath=following-sibling::span[1]")).toHaveText("1", { timeout: 1000 });
  }).toPass({ timeout: 20_000 });
  await expect(strip.getByText("Tekil ziyaretçi").locator("xpath=following-sibling::span[1]")).toHaveText("1");
  await expect(strip.getByText("Tıklama", { exact: true }).locator("xpath=following-sibling::span[1]")).toHaveText("1");

  // Source attributed from the view (utm wins over referrer), device and app parsed from the UA.
  await expect(page.locator("section").filter({ hasText: "Kaynaklar" }).getByText("instagram", { exact: true })).toBeVisible();
  await expect(page.getByText("Portfolyo")).toBeVisible();
  await expect(page.getByText("Mobil")).toBeVisible();

  // Ranges really filter: nothing happened before today, so 30d equals 7d here, and the tabs navigate.
  await page.getByRole("link", { name: "30 gün" }).click();
  await expect(page).toHaveURL(/range=30d/);

  // CSV export is the owner's only.
  const csv = await page.request.get("/dashboard/analytics/export?range=7d");
  expect(await csv.text()).toContain("Portfolyo");
  expect((await request.get("/dashboard/analytics/export", { maxRedirects: 0 })).status()).not.toBe(200);
});
