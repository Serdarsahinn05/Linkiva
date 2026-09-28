import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { sql } from "./db";
import { createUser, lastMail, uid, visitorIp } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 120_000 });

// Headless Chrome announces itself, and the click counter (correctly) drops it; strangers use a phone's UA.
const REAL_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0";
const PASSWORD = "correct-horse-1";

/** RFC 6238 code (SHA-1, 6 digits, 30 s): what an authenticator app shows for this base32 key. */
function totp(secret: string, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.replace(/[\s=]/g, "").toUpperCase()].map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Giriş yap" }).click();
}

async function insertBlock(username: string, data: object) {
  const [{ id: profileId }] = await sql(`select id from profile where username = $1`, [username]);
  const id = `b13${uid()}`;
  await sql(`insert into block (id, "profileId", type, position, data, "updatedAt") values ($1, $2, 'LINK', 0, $3, now())`, [id, profileId, JSON.stringify(data)]);
  return id;
}

const clicks = async (blockId: string) => Number((await sql(`select count(*)::int as n from event where "blockId" = $1 and type = 'CLICK'`, [blockId]))[0].n);

test("a sensitive link shows a warning page first, works without JS and counts the tap only after it", async ({ page, browser, request }) => {
  const username = `gt-${uid()}`;
  await createUser(page, username);
  const id = await insertBlock(username, { title: "Sezon finali", url: "https://example.com/final", gate: "spoiler", card: "1", img: "" });

  const visitor = await browser.newContext({ javaScriptEnabled: false, userAgent: REAL_UA, locale: "tr-TR", extraHTTPHeaders: { "x-forwarded-for": visitorIp() } });
  const pub = await visitor.newPage();
  await pub.goto(`/${username}`);
  const link = pub.getByRole("link", { name: /Sezon finali/ });
  await expect(link).toContainText("Spoiler");
  await link.click();

  await expect(pub).toHaveURL(new RegExp(`/l/${id}/gate$`));
  await expect(pub.getByRole("heading", { name: "Bu link sürprizi bozabilir" })).toBeVisible();
  await expect(pub.getByText("example.com")).toBeVisible();
  await expect(pub.getByRole("link", { name: "Geri dön" })).toHaveAttribute("href", new RegExp(`/${username}$`));
  const onward = await pub.getByRole("link", { name: "Devam et" }).getAttribute("href");
  expect(onward).toBe(`/l/${id}?ok=1`);
  if (process.env.SHOT_DIR) await pub.screenshot({ path: `${process.env.SHOT_DIR}/gate-1440.png` });
  await visitor.close();

  // Seeing the warning is not a tap; confirming it is, and forwards to the destination.
  expect(await clicks(id)).toBe(0);
  const first = await request.get(`/l/${id}`, { maxRedirects: 0, headers: { "user-agent": REAL_UA, "x-forwarded-for": visitorIp() } });
  expect(first.headers().location).toBe(`/l/${id}/gate`);
  const confirmed = await request.get(onward!, { maxRedirects: 0, headers: { "user-agent": REAL_UA, "x-forwarded-for": visitorIp() } });
  expect(confirmed.status()).toBe(302);
  expect(confirmed.headers().location).toBe("https://example.com/final");
  await expect.poll(() => clicks(id)).toBe(1);

  // A link without the warning never has a warning page.
  const plain = await insertBlock(username, { title: "Blog", url: "https://example.com/blog" });
  expect((await request.get(`/l/${plain}/gate`)).status()).toBe(404);
});

test("the editor sets the warning and flags a link the daily check could not open", async ({ page }) => {
  const username = `lc-${uid()}`;
  await createUser(page, username);
  const id = await insertBlock(username, { title: "Eski dükkan", url: "https://dead.example.com/shop" });
  await sql(`insert into link_check ("blockId", url, status, "failCount", "checkedAt") values ($1, $2, 'BROKEN', 2, now())`, [id, "https://dead.example.com/shop"]);
  await page.goto("/dashboard");
  const row = page.getByRole("region", { name: "Bloklar" }).getByRole("listitem").first();
  await expect(row.getByText("Ulaşılamıyor")).toBeVisible();
  await expect(row.getByText(/art arda iki kez açılmadı/)).toBeVisible();

  // Sensitive content warning from the row menu.
  await row.getByRole("button", { name: "Diğer işlemler" }).click();
  await page.getByRole("menuitemradio", { name: "18+ uyarısı" }).click();
  await expect(row.getByText("· 18+ uyarısı")).toBeVisible();
  const preview = page.getByRole("complementary", { name: "Önizleme" });
  await expect(preview.getByText("18+", { exact: true })).toBeVisible();

  // A new address is a new destination: the old result no longer applies.
  await row.getByLabel("Adres").fill("example.com/new-shop");
  await expect(row.getByText("Ulaşılamıyor")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Kaydedildi" })).toBeVisible({ timeout: 30_000 });
  const [{ data }] = await sql(`select data from block where id = $1`, [id]);
  expect(data).toMatchObject({ gate: "adult", url: "https://example.com/new-shop" });
});

test("two-step verification: nobody gets in with the password alone", async ({ page, browser }) => {
  const username = `tf-${uid()}`;
  const { email } = await createUser(page, username);

  // Turn it on: password, scan (read the key), confirm a code, keep the backup codes.
  await page.goto("/dashboard/settings");
  const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "İki adımlı doğrulama" }) });
  await section.getByRole("button", { name: "Aç" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mevcut şifre").fill("wrong-password-9");
  await dialog.getByRole("button", { name: "Devam et" }).click();
  await expect(dialog.getByText("Mevcut şifre hatalı.")).toBeVisible();
  await dialog.getByLabel("Mevcut şifre").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Devam et" }).click();
  const secret = (await dialog.getByTestId("totp-secret").textContent())!.replace(/\s/g, "");
  expect(secret).toMatch(/^[A-Z2-7]{16,}$/);
  await dialog.getByLabel("6 haneli kod").fill("000000");
  await dialog.getByRole("button", { name: "Onayla ve aç" }).click();
  await expect(dialog.getByText("Kod hatalı.")).toBeVisible();
  await dialog.getByLabel("6 haneli kod").fill(totp(secret));
  await dialog.getByRole("button", { name: "Onayla ve aç" }).click();
  await expect(dialog.getByText("İki adımlı doğrulama açıldı.")).toBeVisible();
  const codes = await dialog.getByTestId("backup-codes").getByRole("listitem").allTextContents();
  expect(codes.length).toBeGreaterThanOrEqual(8);
  await dialog.getByRole("button", { name: "Kaydettim" }).click();
  await expect(section.getByText("Açık", { exact: true })).toBeVisible();

  // A fresh browser: the right password alone leads to the code step, and no session exists yet.
  const other = await browser.newContext({ locale: "tr-TR" });
  const stranger = await other.newPage();
  await signIn(stranger, email);
  await expect(stranger.getByRole("heading", { name: "Doğrulama kodu" })).toBeVisible();
  await stranger.goto("/dashboard");
  await expect(stranger).toHaveURL(/\/login/);

  await signIn(stranger, email);
  await stranger.getByLabel("6 haneli kod").fill("123456");
  await stranger.getByRole("button", { name: "Doğrula" }).click();
  await expect(stranger.getByRole("alert").filter({ hasText: "Kod hatalı." })).toBeVisible();
  await stranger.getByLabel("6 haneli kod").fill(totp(secret));
  await stranger.getByRole("button", { name: "Doğrula" }).click();
  await expect(stranger).toHaveURL(/\/dashboard$/);
  await other.close();

  // A backup code works once.
  const third = await browser.newContext({ locale: "tr-TR" });
  const lost = await third.newPage();
  await signIn(lost, email);
  await lost.getByRole("button", { name: /Yedek kod kullan/ }).click();
  await lost.getByLabel("Yedek kod").fill(codes[0]!);
  await lost.getByRole("button", { name: "Doğrula" }).click();
  await expect(lost).toHaveURL(/\/dashboard$/);
  await lost.context().clearCookies();
  await signIn(lost, email);
  await lost.getByRole("button", { name: /Yedek kod kullan/ }).click();
  await lost.getByLabel("Yedek kod").fill(codes[0]!);
  await lost.getByRole("button", { name: "Doğrula" }).click();
  await expect(lost.getByRole("alert").filter({ hasText: "Kod hatalı." })).toBeVisible();
  await third.close();

  // Turning it off asks for the password and mails a security notice.
  const started = Date.now();
  await page.goto("/dashboard/settings");
  await section.getByRole("button", { name: "Kapat" }).click();
  await dialog.getByLabel("Mevcut şifre").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Kapat" }).click();
  await expect(section.getByRole("button", { name: "Aç" })).toBeVisible();
  await lastMail(email, "twoFactorOff", started);
});

test("the dashboard installs as an app; profiles do not link the manifest", async ({ page, request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.headers()["content-type"]).toContain("application/manifest+json");
  const manifest = await res.json();
  expect(manifest).toMatchObject({ start_url: "/dashboard", display: "standalone", name: "Linkiva" });
  for (const icon of manifest.icons as { src: string }[]) expect((await request.get(icon.src)).headers()["content-type"]).toBe("image/png");

  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  const username = `pw-${uid()}`;
  await createUser(page, username);
  await page.goto(`/${username}`);
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
});
