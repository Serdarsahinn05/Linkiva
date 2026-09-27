import { expect, test, type Page } from "@playwright/test";
import { sql } from "./db";
import { createUser, uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 120_000 });

const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible({ timeout: 30_000 });

// Chrome resolves any *.localhost name to this machine, so "<name>.localhost" stands in for an owner's domain.
test("a verified custom domain serves its profile and nothing else of the site", async ({ page, browser, baseURL }) => {
  const username = `cd-${uid()}`;
  await createUser(page, username);
  await page.getByRole("button", { name: "Link ekle" }).click();
  await page.getByLabel("Başlık", { exact: true }).first().fill("Portfolyo");
  await page.getByLabel("Adres").first().fill("example.com/portfolyo");
  await saved(page);

  const port = new URL(baseURL!).port;
  const hostname = `${username}.localhost`;
  const origin = `http://${hostname}:${port}`;
  const [{ id: profileId }] = await sql(`select id from profile where username = $1`, [username]);
  await sql(`insert into custom_domain (id, "profileId", hostname) values ($1, $2, $3)`, [`cd_${username}`, profileId, hostname]);

  const visitor = await (await browser.newContext({ locale: "tr-TR" })).newPage();
  // Not verified yet: the domain shows nothing.
  expect((await visitor.goto(`${origin}/`))?.status()).toBe(404);

  // Once verified (the proxy remembers a miss for a minute, so the verified name is a fresh one).
  const live = `${username}-live.localhost`;
  await sql(`update custom_domain set hostname = $1, "verifiedAt" = now() where "profileId" = $2`, [live, profileId]);
  const liveOrigin = `http://${live}:${port}`;
  const home = await visitor.goto(`${liveOrigin}/`);
  expect(home?.status()).toBe(200);
  await expect(visitor.getByRole("heading", { name: username })).toBeVisible();
  // The canonical address is the domain, and links still go through /l on it.
  await expect(visitor.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://${live}`);
  const link = visitor.getByRole("link", { name: "Portfolyo" });
  expect(await link.getAttribute("href")).toMatch(/^\/l\//);
  // (in the browser: Node's resolver, used by the API client, does not know *.localhost). The target site is stubbed.
  await visitor.route("https://example.com/**", (route) => route.fulfill({ body: "portfolyo" }));
  await link.click();
  await expect(visitor).toHaveURL("https://example.com/portfolyo");

  // Nothing else of the site lives on the owner's domain.
  for (const path of ["/dashboard", "/login", "/privacy", `/${username}`]) {
    expect((await visitor.goto(`${liveOrigin}${path}`))?.status(), path).toBe(404);
  }
  expect((await visitor.goto(`${liveOrigin}/story`))?.status()).toBe(200);
});
