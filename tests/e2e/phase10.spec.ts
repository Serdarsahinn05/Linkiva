import { expect, test, type Page } from "@playwright/test";
import { createUser, uid, visitorIp } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop; the public page is checked at both widths");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 120_000 });

const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible({ timeout: 30_000 });
const rows = (page: Page) => page.getByRole("region", { name: "Bloklar" }).getByRole("listitem");

async function addLink(page: Page, title: string) {
  const before = await rows(page).count();
  await page.getByRole("button", { name: "Link ekle" }).click();
  await expect(rows(page)).toHaveCount(before + 1);
  await page.getByLabel("Başlık", { exact: true }).first().fill(title);
  await page.getByLabel("Adres").first().fill(`${title.toLowerCase()}.example.com`);
}

async function resize(page: Page, title: string, size: string) {
  const row = page.locator("li", { has: page.locator(`input[value="${title}"]`) });
  await row.getByRole("button", { name: "Diğer işlemler" }).click();
  await page.getByRole("menuitemradio", { name: size }).click();
  await expect(row.getByText(`· ${size}`)).toBeVisible();
}

test("grid layout: tile sizes from the editor reach the public page in DOM order", async ({ page, browser }) => {
  const username = `gr-${uid()}`;
  await createUser(page, username);

  // New blocks go on top: added in reverse, they read Portfolyo, GitHub, Blog, İletişim on the page.
  for (const title of ["İletişim", "Blog", "GitHub", "Portfolyo"]) await addLink(page, title);
  await saved(page);

  // Sizes are a grid thing: the menu does not offer them in the list layout.
  await rows(page).first().getByRole("button", { name: "Diğer işlemler" }).click();
  await expect(page.getByRole("menuitemradio", { name: /karo|Tam satır/ })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.goto("/dashboard/appearance");
  await page.getByRole("radio", { name: /Izgara/ }).click();
  await saved(page);
  // Picking a theme keeps the layout.
  await page.getByRole("radio", { name: /Gece/ }).click();
  await saved(page);
  await expect(page.getByRole("radio", { name: /Izgara/ })).toBeChecked();

  await page.goto("/dashboard");
  await resize(page, "Portfolyo", "Büyük karo");
  await resize(page, "GitHub", "Küçük karo");
  await resize(page, "Blog", "Küçük karo");
  await saved(page);

  const shots = process.env.SHOT_DIR;
  if (shots) {
    await rows(page).first().getByRole("button", { name: "Diğer işlemler" }).click();
    await page.screenshot({ path: `${shots}/editor-1440.png` });
    await page.keyboard.press("Escape");
    await page.goto("/dashboard/appearance");
    await page.screenshot({ path: `${shots}/appearance-1440.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${shots}/appearance-390.png` });
    await page.goto("/dashboard");
    await rows(page).first().getByRole("button", { name: "Diğer işlemler" }).click();
    await page.screenshot({ path: `${shots}/editor-390.png` });
  }

  for (const [width, columns] of [
    [390, 2],
    [1440, 4],
  ] as const) {
    const visitor = await browser.newContext({ viewport: { width, height: 900 }, locale: "tr-TR", extraHTTPHeaders: { "x-forwarded-for": visitorIp() } });
    const pub = await visitor.newPage();
    await pub.goto(`/${username}`);
    const list = pub.getByRole("main").getByRole("list").last();
    const links = list.getByRole("link");
    await expect(links).toHaveText(["Portfolyo", "GitHub", "Blog", "İletişim"]);
    expect(await list.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(columns);

    const box = async (name: string) => (await links.filter({ hasText: name }).boundingBox())!;
    const [large, small, wide] = [await box("Portfolyo"), await box("GitHub"), await box("İletişim")];
    expect(Math.abs(small.width - small.height)).toBeLessThan(2); // square tiles
    expect(Math.abs(large.width - large.height)).toBeLessThan(2);
    expect(large.width).toBeGreaterThan(small.width * 1.9);
    expect(wide.width).toBeGreaterThan(large.width * (columns === 4 ? 1.9 : 0.99)); // a full row

    const { scroll, client } = await pub.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(scroll).toBeLessThanOrEqual(client);
    if (process.env.SHOT_DIR) await pub.screenshot({ path: `${process.env.SHOT_DIR}/grid-${width}.png`, fullPage: true });
    await visitor.close();
  }
});

test("story image: 1080×1920 PNG with the QR, downloadable from the QR dialog, gone when unpublished", async ({ page, request }) => {
  const username = `st-${uid()}`;
  await createUser(page, username);

  const res = await request.get(`/${username}/story`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const png = await res.body();
  // PNG header: width and height are big-endian at bytes 16 and 20.
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, 1920]);
  // The dark and light looks are other images of the same size; an unknown look falls back to the profile's.
  const light = await (await request.get(`/${username}/story?look=light`)).body();
  expect(light.readUInt32BE(20)).toBe(1920);
  expect(light.equals(png)).toBe(false);
  expect((await request.get(`/${username}/story?look=neon`)).status()).toBe(200);

  // With a mouse, the dialog downloads it (the share sheet is for touch devices). The preview follows the chosen look.
  await page.getByRole("button", { name: "QR kod" }).click();
  const preview = page.getByRole("img", { name: "Hikâye görselinin önizlemesi" });
  await expect(preview).toHaveAttribute("src", `/${username}/story`);
  await page.getByRole("radio", { name: "Açık" }).click();
  await expect(preview).toHaveAttribute("src", `/${username}/story?look=light`);
  await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalHeight)).toBe(1920);
  if (process.env.SHOT_DIR) {
    await page.screenshot({ path: `${process.env.SHOT_DIR}/qr-1440.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${process.env.SHOT_DIR}/qr-390.png` });
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Hikâye görseli" }).click();
  expect((await download).suggestedFilename()).toBe(`linkiva-${username}-story.png`);
  await page.keyboard.press("Escape");

  await page.goto("/dashboard/settings");
  await page.getByRole("switch", { name: "Sayfa yayında" }).click();
  await saved(page);
  expect((await request.get(`/${username}/story`)).status()).toBe(404);
});

test("a YouTube channel address offers the latest video instead of an error", async ({ page }) => {
  await createUser(page, `lv-${uid()}`);
  await page.getByRole("button", { name: "Embed ekle" }).click();
  await page.getByLabel("Video ya da müzik linki").fill("youtube.com/@linkiva");
  await page.getByLabel("Video ya da müzik linki").blur();
  await expect(page.getByRole("switch", { name: "Kanalın son videosu" })).toBeVisible();
  await expect(page.getByText("YouTube, Spotify ya da SoundCloud linki yapıştır.")).toBeHidden();
  // A plain video address is just a video.
  await page.getByLabel("Video ya da müzik linki").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await expect(page.getByRole("switch", { name: "Kanalın son videosu" })).toBeHidden();
});
