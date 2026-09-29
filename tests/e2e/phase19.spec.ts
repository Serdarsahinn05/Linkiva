import { expect, test } from "@playwright/test";
import { sql } from "./db";
import { createUser, uid, visitorIp } from "./helpers";

test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 90_000 });

const shots = process.env.SHOT_DIR;

test("the admin panel does not exist for anyone but staff with two-step verification", async ({ page, request }, info) => {
  // Signed out: a plain 404, not a sign-in page.
  const anonymous = await request.get("/admin", { maxRedirects: 0 });
  expect(anonymous.status()).toBe(404);

  const username = `adm-${uid()}`;
  const { email } = await createUser(page, username);

  // A normal user: the same 404.
  expect((await page.goto("/admin"))?.status()).toBe(404);

  // Staff without two-step verification: only the way to turn it on.
  await sql(`UPDATE "user" SET role = 'ADMIN' WHERE email = $1`, [email]);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Önce iki adımlı doğrulama" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ayarlara git" })).toHaveAttribute("href", "/dashboard/settings");

  // With it: the panel, locked for sensitive actions until a code is confirmed.
  await sql(`UPDATE "user" SET "twoFactorEnabled" = true WHERE email = $1`, [email]);
  const response = await page.goto("/admin");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  await expect(page.getByRole("heading", { name: "Genel bakış", level: 1 })).toBeVisible();
  if (info.project.name === "desktop") {
    await expect(page.getByRole("complementary").getByRole("button", { name: "Hassas işlemleri aç" })).toBeVisible();
    if (shots) await page.screenshot({ path: `${shots}/admin-1440.png` });
  } else {
    await expect(page.getByRole("banner").getByRole("button", { name: "Hassas işlemleri aç" })).toBeVisible();
    if (shots) await page.screenshot({ path: `${shots}/admin-390.png` });
  }

  // An admin finds accounts by name; the page shows the email, to admins only.
  if (info.project.name === "desktop") {
    await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
    await page.getByRole("link", { name: new RegExp(`@${username}`) }).click();
    await expect(page.getByText(email)).toBeVisible();
    if (shots) await page.screenshot({ path: `${shots}/admin-user-1440.png` });
    await page.goto("/admin/audit");
    await expect(page.getByRole("heading", { name: "Günlük", level: 1 })).toBeVisible();
    await expect(page.getByText("E-postayla hesap arandı").first()).toBeVisible();
    await page.goto("/admin");
  }

  // A wrong code is refused and logged.
  await page.getByRole("button", { name: "Hassas işlemleri aç" }).filter({ visible: true }).click();
  await page.getByLabel("6 haneli kod").fill("000000");
  await page.getByRole("button", { name: "Doğrula" }).click();
  await expect(page.getByText("Kod doğru değil ya da süresi geçmiş.")).toBeVisible();
  if (shots && info.project.name === "desktop") await page.screenshot({ path: `${shots}/admin-stepup-1440.png` });
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByText("Hatalı doğrulama kodu").first()).toBeVisible();
});

test("a suspended page tells visitors it is unavailable and its owner why", async ({ page, request }, info) => {
  test.skip(info.project.name !== "desktop", "one run is enough");
  const owner = `sus-${uid()}`;
  const { email } = await createUser(page, owner);
  // Suspended before anyone visits it (the action itself is covered by tests/integration/admin.test.ts).
  await sql(`UPDATE "profile" SET "suspendedAt" = now(), "isPublished" = false WHERE "userId" = (SELECT id FROM "user" WHERE email = $1)`, [email]);

  const visit = await request.get(`/${owner}`);
  expect(await visit.text()).toContain("Bu sayfaya şu an ulaşılamıyor");
  expect((await request.get(`/report/${owner}`)).status()).toBe(404);

  await page.goto("/dashboard");
  await expect(page.getByText("Sayfan Kullanım Koşullarına aykırı bulunduğu için askıya alındı")).toBeVisible();
  if (shots) await page.screenshot({ path: `${shots}/suspended-owner-1440.png` });
});

test("a visitor reports a page from its foot, and staff dismiss it from the queue", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop", "one run of the whole flow; the report page is checked at 390px below");
  const owner = `rpt-${uid()}`;
  await createUser(page, owner);

  // A visitor (another browser, no session) finds the quiet link at the foot of the page.
  const visitor = await browser.newContext({ locale: "tr-TR", extraHTTPHeaders: { "x-forwarded-for": visitorIp() } });
  const v = await visitor.newPage();
  await v.goto(`/${owner}`);
  await v.getByRole("link", { name: "Bu sayfayı bildir" }).click();
  await expect(v).toHaveURL(new RegExp(`/report/${owner}$`));
  await expect(v.getByRole("heading", { name: "Bu sayfayı bildir" })).toBeVisible();
  if (shots) await v.screenshot({ path: `${shots}/report-1440.png`, fullPage: true });
  await v.getByRole("radio", { name: /Dolandırıcılık ya da kimlik avı/ }).check();
  await v.getByLabel("Ayrıntı").fill("Banka şifresi istiyor.");
  await v.getByRole("button", { name: "Bildirimi gönder" }).click();
  await expect(v.getByRole("heading", { name: "Bildirimin bize ulaştı" })).toBeVisible();
  if (shots) {
    await v.setViewportSize({ width: 390, height: 844 });
    await v.goto(`/report/${owner}`);
    await v.screenshot({ path: `${shots}/report-390.png`, fullPage: true });
  }
  await visitor.close();

  // Staff: the queue shows it; its page shows the report and the page as visitors see it.
  const staff = `stf-${uid()}`;
  await page.context().clearCookies();
  const { email } = await createUser(page, staff);
  await sql(`UPDATE "user" SET role = 'MODERATOR', "twoFactorEnabled" = true WHERE email = $1`, [email]);
  // Users (and their emails) are for admins only: a moderator gets the 404.
  expect((await page.goto("/admin/users"))?.status()).toBe(404);
  expect((await page.goto("/admin/audit"))?.status()).toBe(404);
  await page.goto("/admin/reports");
  const row = page.getByRole("link", { name: new RegExp(`@${owner}`) });
  await expect(row).toBeVisible();
  if (shots) await page.screenshot({ path: `${shots}/admin-reports-1440.png` });
  await row.click();
  await expect(page.getByRole("heading", { name: "Dolandırıcılık ya da kimlik avı", level: 1 })).toBeVisible();
  await expect(page.getByText("Banka şifresi istiyor.")).toBeVisible();
  if (shots) await page.screenshot({ path: `${shots}/admin-report-1440.png` });

  await page.getByRole("button", { name: "Yok say", exact: true }).click();
  await page.getByLabel("Not").fill("Test");
  await page.getByRole("button", { name: "Yok say ve kapat" }).click();
  await expect(page).toHaveURL(/\/admin\/reports$/);
  await expect(page.getByRole("link", { name: new RegExp(`@${owner}`) })).toHaveCount(0);
});
