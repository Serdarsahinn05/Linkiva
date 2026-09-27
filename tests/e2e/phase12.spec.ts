import { expect, test, type Page } from "@playwright/test";
import { sql } from "./db";
import { createUser, uid, visitorIp } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop; the public page is checked at both widths");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 120_000 });

const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible({ timeout: 30_000 });

/** A portfolio page in the owner's block order: intro links, then Projects, Experience and Skills sections. */
async function seedPortfolio(username: string) {
  const [{ id: profileId }] = await sql(`select id from profile where username = $1`, [username]);
  await sql(`update profile set theme = 'portfolyo', bio = $2 where id = $1`, [profileId, "Web ve oyun geliştiriyorum."]);
  const blocks: [string, string, object][] = [
    ["LINK", "WIDE", { title: "Özgeçmiş", url: "https://example.com/cv.pdf" }],
    ["LINK", "WIDE", { title: "Birlikte çalışalım", url: "mailto:serdar@example.com" }],
    ["HEADER", "WIDE", { text: "Projeler" }],
    ["PROJECT", "LARGE", { title: "Linkiva", desc: "Ücretsiz bio-link platformu", url: "https://example.com/linkiva", repo: "https://github.com/example/linkiva", tags: "next.js, postgres", stars: "12" }],
    ["PROJECT", "SMALL", { title: "claudiva", repo: "https://github.com/example/claudiva" }],
    ["PROJECT", "SMALL", { title: "Blogiva", repo: "https://github.com/example/blogiva" }],
    ["PROJECT", "WIDE", { title: "Aethernity: Overrun", desc: "Roguelite, bullet heaven türünde oyun.", tags: "godot, roguelite" }],
    ["HEADER", "WIDE", { text: "Deneyim" }],
    ["EXPERIENCE", "WIDE", { role: "Stajyer", org: "Örnek Şirket", start: "2025-06", desc: "Arka uç servisleri." }],
    ["EXPERIENCE", "WIDE", { role: "Bilgisayar Mühendisliği", org: "Hacettepe Üniversitesi", start: "2022", end: "2026" }],
    ["HEADER", "WIDE", { text: "Yetenekler" }],
    ["SKILLS", "WIDE", { title: "Diller", items: "typescript, c#, sql" }],
    ["SKILLS", "WIDE", { title: "Araçlar", items: "next.js, node.js, postgresql, godot" }],
  ];
  for (const [i, [type, size, data]] of blocks.entries()) {
    await sql(`insert into block (id, "profileId", type, position, data, size, "updatedAt") values ($1, $2, $3, $4, $5, $6, now())`, [
      `pf${i}${username}`.slice(0, 30),
      profileId,
      type,
      i,
      JSON.stringify(data),
      size,
    ]);
  }
  return profileId as string;
}

test("portfolio theme: wide two-part layout on desktop, one column on a phone", async ({ page, browser }) => {
  const username = `pf-${uid()}`;
  await createUser(page, username);
  await seedPortfolio(username);

  for (const width of [1440, 390]) {
    const visitor = await browser.newContext({ viewport: { width, height: 900 }, locale: "tr-TR", extraHTTPHeaders: { "x-forwarded-for": visitorIp() } });
    const pub = await visitor.newPage();
    await pub.goto(`/${username}`);

    // Section titles, projects as tiles, one timeline for both experiences, skills as lists.
    await expect(pub.getByRole("heading", { level: 2 })).toHaveText(["Projeler", "Deneyim", "Yetenekler"]);
    await expect(pub.getByRole("link", { name: /^Linkiva Ücretsiz/ })).toBeVisible();
    await expect(pub.locator("ol")).toHaveCount(1);
    await expect(pub.locator("ol > li")).toHaveCount(2);
    await expect(pub.locator("ol > li").first()).toContainText("şimdi");
    await expect(pub.getByText("typescript", { exact: true })).toBeVisible();

    const box = async (text: string) => (await pub.getByRole("heading", { name: text }).boundingBox())!;
    const [name, cv] = [await box(username), (await pub.getByRole("link", { name: "Özgeçmiş" }).boundingBox())!];
    const [experience, skills] = [await box("Deneyim"), await box("Yetenekler")];
    if (width === 1440) {
      // Links beside the name; Experience and Skills side by side.
      expect(cv.x).toBeGreaterThan(name.x + name.width);
      expect(Math.abs(experience.y - skills.y)).toBeLessThan(2);
      expect(skills.x).toBeGreaterThan(experience.x + 200);
    } else {
      expect(cv.y).toBeGreaterThan(name.y);
      expect(skills.y).toBeGreaterThan(experience.y);
    }
    const { scroll, client } = await pub.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(scroll).toBeLessThanOrEqual(client);
    if (process.env.SHOT_DIR) await pub.screenshot({ path: `${process.env.SHOT_DIR}/portfolio-${width}.png`, fullPage: true });
    await visitor.close();
  }
});

test("a project card opens its live page; its Code link opens the repository", async ({ page, request }) => {
  const username = `pc-${uid()}`;
  await createUser(page, username);
  await seedPortfolio(username);
  const [{ id }] = await sql(`select id from block where "profileId" = (select id from profile where username = $1) and type = 'PROJECT' and data->>'title' = 'Linkiva'`, [username]);
  const live = await request.get(`/l/${id}`, { maxRedirects: 0, headers: { "x-forwarded-for": visitorIp() } });
  expect(live.headers().location).toBe("https://example.com/linkiva");
  const code = await request.get(`/l/${id}?k=repo`, { maxRedirects: 0, headers: { "x-forwarded-for": visitorIp() } });
  expect(code.headers().location).toBe("https://github.com/example/linkiva");
});

test("project, experience and skills blocks are edited from the editor", async ({ page }) => {
  await createUser(page, `pe-${uid()}`);
  await page.getByRole("button", { name: "Yetenekler ekle" }).click();
  await page.getByLabel("Yetenekler", { exact: true }).fill("typescript, react, typescript");
  await page.getByRole("button", { name: "Deneyim ekle" }).click();
  await page.getByLabel("Rol ya da bölüm").fill("Stajyer");
  await page.getByLabel("Başlangıç").fill("2025-06");
  await page.getByLabel("Bitiş").fill("2024-01");
  await expect(page.getByText("Bitiş, başlangıçtan önce olamaz.")).toBeVisible();
  await page.getByLabel("Bitiş").fill("");
  await page.getByRole("button", { name: "Proje ekle" }).click();
  await page.getByLabel("Proje adı").fill("Linkiva");
  await page.getByLabel("Kod adresi, ör. GitHub (isteğe bağlı)").fill("github.com/example/linkiva");
  await saved(page);
  // The live preview shows them (skills de-duplicated).
  const preview = page.getByRole("complementary", { name: "Önizleme" });
  await expect(preview.getByRole("heading", { name: "Linkiva" })).toBeVisible();
  await expect(preview.getByText("Stajyer")).toBeVisible();
  await expect(preview.getByText("typescript", { exact: true })).toHaveCount(1);
});
