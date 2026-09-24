import { expect, test, type Page } from "@playwright/test";
import { createUser, uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "editor flow runs once on desktop; mobile layout is covered by screenshots");
test.use({ locale: "tr-TR" });

/** Adds a block and waits for its row, so typing never lands in the previous block. */
async function addBlock(page: Page, type: string) {
  const rows = page.getByRole("region", { name: "Bloklar" }).getByRole("listitem");
  const before = await rows.count();
  await page.getByRole("button", { name: `${type} ekle` }).click();
  await expect(rows).toHaveCount(before + 1);
}

async function waitSaved(page: Page) {
  await expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible();
}

test.describe.configure({ timeout: 90_000 });

test("build a page in the editor and see it live", async ({ page, request }) => {
  const username = `ed-${uid()}`;
  await createUser(page, username);
  await expect(page.getByText("Buraya ilk linkini yapıştır")).toBeVisible();

  // Profile basics.
  await page.getByLabel("Görünen ad").fill("Editör Testi");
  await page.getByLabel("Hakkında").fill("Linkiva e2e profili.");
  await waitSaved(page);

  // Two links and a header. New blocks go on top, so add in reverse reading order.
  await addBlock(page, "Link");
  await page.getByLabel("Başlık", { exact: true }).first().fill("Blog");
  await page.getByLabel("Adres").first().fill("blog.example.com");
  await addBlock(page, "Link");
  await page.getByLabel("Başlık", { exact: true }).first().fill("GitHub");
  await page.getByLabel("Adres").first().fill("github.com/linkiva");
  await addBlock(page, "Başlık");
  await page.getByLabel("Başlık metni").fill("Projeler");
  await waitSaved(page);

  // An unsafe address is flagged in the editor and never published.
  await addBlock(page, "Link");
  await page.getByLabel("Başlık", { exact: true }).first().fill("Kötü");
  await page.getByLabel("Adres").first().fill("javascript:alert(1)");
  await page.getByLabel("Adres").first().blur();
  await expect(page.getByText("Bu adresi açamayız")).toBeVisible();
  await waitSaved(page);

  // The live preview is the real profile component.
  const preview = page.getByRole("complementary", { name: "Önizleme" });
  await expect(preview.getByText("GitHub", { exact: true })).toBeVisible();
  await expect(preview.getByText("Kötü")).toHaveCount(0);

  // Socials: a pasted profile URL is stored as a handle.
  await page.getByText("Sosyal hesaplar").click();
  await page.getByRole("textbox", { name: "Instagram" }).fill("instagram.com/linkiva");
  await page.getByRole("textbox", { name: "Instagram" }).blur();
  await expect(page.getByRole("textbox", { name: "Instagram" })).toHaveValue("@linkiva");

  // Public page.
  await page.goto(`/${username}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Editör Testi");
  await expect(page.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/linkiva");
  const links = page.locator("main li a[href^=\"/l/\"]");
  await expect(links).toHaveText(["GitHub", "Blog"]);
  await expect(page.getByText("Kötü")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Projeler");

  // /l/<id> redirects to the normalised destination.
  const href = await links.first().getAttribute("href");
  expect(href).toMatch(/^\/l\//);
  const redirect = await request.get(href!, { maxRedirects: 0 });
  expect(redirect.status()).toBe(302);
  expect(redirect.headers().location).toBe("https://github.com/linkiva");

  // Hide "GitHub", move "Blog" above the header, delete and undo.
  await page.goto("/dashboard");
  const githubRow = page.locator("li", { has: page.locator('input[value="GitHub"]') });
  await githubRow.getByRole("switch", { name: "Sayfada göster" }).click();
  const blogRow = page.locator("li", { has: page.locator('input[value="Blog"]') });
  await blogRow.getByRole("button", { name: "Diğer işlemler" }).click();
  await page.getByRole("menuitem", { name: "Yukarı taşı" }).click();
  await blogRow.getByRole("button", { name: "Diğer işlemler" }).click();
  await page.getByRole("menuitem", { name: "Sil" }).click();
  await expect(page.getByText("Blok silindi.")).toBeVisible();
  await page.getByRole("button", { name: "Geri al" }).click();
  await expect(page.locator('input[value="Blog"]')).toBeVisible();
  await waitSaved(page);

  await page.goto(`/${username}`);
  await expect(page.locator("main li a[href^=\"/l/\"]")).toHaveText(["Blog"]);
  await expect(page.getByText("GitHub", { exact: true })).toHaveCount(0);

  // Unknown profiles are a real 404.
  const missing = await request.get(`/nobody-${uid()}`);
  expect(missing.status()).toBe(404);
});
