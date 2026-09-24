import { expect, test, type Page } from "@playwright/test";
import { createUser, uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");
test.use({ locale: "tr-TR" });

async function addBlock(page: Page, type: string) {
  const rows = page.getByRole("region", { name: "Bloklar" }).getByRole("listitem");
  const before = await rows.count();
  await page.getByRole("button", { name: `${type} ekle` }).click();
  await expect(rows).toHaveCount(before + 1);
}

const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible();

test("themes, embeds, email capture, scheduling and publishing", async ({ page, request }) => {
  const username = `p3-${uid()}`;
  await createUser(page, username);

  // Blocks: a link, a YouTube embed, an email capture, and a link scheduled for next year.
  await addBlock(page, "Link");
  await page.getByLabel("Başlık", { exact: true }).first().fill("Site");
  await page.getByLabel("Adres").first().fill("example.com");
  await addBlock(page, "Embed");
  await page.getByLabel("Video ya da müzik linki").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await addBlock(page, "E-posta");
  await page.getByLabel("Başlık (isteğe bağlı)").fill("Bültenime katıl");
  await addBlock(page, "Link");
  await page.getByLabel("Başlık", { exact: true }).first().fill("Gelecek");
  await page.getByLabel("Adres").first().fill("future.example.com");
  await saved(page);

  const futureRow = page.locator("li", { has: page.locator('input[value="Gelecek"]') });
  await futureRow.getByRole("button", { name: "Diğer işlemler" }).click();
  await page.getByRole("menuitem", { name: "Planla" }).click();
  const nextYear = new Date().getFullYear() + 1;
  await page.getByLabel("Başlangıç").fill(`${nextYear}-01-01T10:00`);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(futureRow.getByText(/tarihinde yayında/)).toBeVisible();
  await saved(page);

  // Theme: "Terminal" pins dark mode, mono font and outline buttons.
  await page.goto("/dashboard/appearance");
  await page.getByRole("radio", { name: /Terminal/ }).click();
  await saved(page);

  await page.goto(`/${username}`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const scene = page.locator(".profile-scene");
  await expect(scene).toHaveAttribute("data-font", "mono");
  await expect(scene).toHaveAttribute("data-button", "outline");

  // Scheduled link is hidden; the live one is shown.
  await expect(page.getByRole("link", { name: "Site" })).toBeVisible();
  await expect(page.getByText("Gelecek")).toHaveCount(0);

  // Lite embed: no iframe until the visitor presses play, then a privacy-mode YouTube iframe.
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: /Oynat/ }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);

  // Email capture: subscribe, then the same address again looks identical.
  const email = `fan-${uid()}@example.com`;
  for (let i = 0; i < 2; i++) {
    await page.goto(`/${username}`);
    await expect(page.getByText("Bültenime katıl")).toBeVisible();
    await page.getByLabel("E-posta adresin").fill(email);
    await page.getByRole("button", { name: "Abone ol" }).click();
    await expect(page.getByText("Teşekkürler, listedesin.")).toBeVisible();
  }

  // The owner sees one subscriber and can export it.
  await page.goto("/dashboard/audience");
  await expect(page.getByText("1 abone")).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  const csv = await page.request.get("/dashboard/audience/export");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain(email);
  // Not for anyone else.
  expect((await request.get("/dashboard/audience/export", { maxRedirects: 0 })).status()).not.toBe(200);

  // Unpublishing turns the page into a 404; SEO title is used while published.
  await page.goto("/dashboard/settings");
  await page.getByLabel("Arama motoru başlığı").fill("Özel Başlık");
  await saved(page);
  await page.goto(`/${username}`);
  await expect(page).toHaveTitle("Özel Başlık");
  await page.goto("/dashboard/settings");
  await page.getByRole("switch", { name: "Sayfa yayında" }).click();
  await saved(page);
  expect((await request.get(`/${username}`)).status()).toBe(404);
});
