import { expect, test, type Page } from "@playwright/test";
import { sql } from "./db";
import { createUser, lastMail, uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");
test.use({ locale: "tr-TR" });
test.describe.configure({ timeout: 120_000 });

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
}

test("email change, password change, data export and account deletion", async ({ page, request }) => {
  const username = `acc-${uid()}`;
  const { email } = await createUser(page, username);
  const newEmail = `new-${username}@example.com`;

  // Email change: the current address approves first, then the new one verifies (v1 bug S4).
  await page.goto("/dashboard/settings");
  const requested = Date.now();
  await page.getByLabel("Yeni e-posta").fill(newEmail);
  await page.getByRole("button", { name: "Doğrulama linki gönder" }).click();
  await expect(page.getByText("Önce şu anki adresine")).toBeVisible();
  const approveUrl = await lastMail(email, "changeEmailConfirm", requested);

  // Until the change completes, the old address still signs in.
  await page.context().clearCookies();
  await login(page, email, "correct-horse-1");
  await expect(page).toHaveURL(/\/dashboard$/);

  const approved = Date.now();
  await page.goto(approveUrl);
  await page.goto(await lastMail(newEmail, "changeEmail", approved));
  await page.goto("/dashboard/settings");
  await expect(page.getByText(newEmail).first()).toBeVisible();

  // Password change, then sign in with the new one.
  await page.getByLabel("Mevcut şifre").fill("correct-horse-1");
  await page.getByLabel("Yeni şifre").fill("brand-new-pass-2");
  await page.getByRole("button", { name: "Şifreyi değiştir" }).click();
  await expect(page.getByText("Şifren değişti.")).toBeVisible();
  await page.context().clearCookies();
  await login(page, newEmail, "brand-new-pass-2");
  await expect(page).toHaveURL(/\/dashboard$/);

  // Data export: complete and free of secrets.
  const exported = await page.request.get("/dashboard/settings/export");
  expect(exported.status()).toBe(200);
  const json = await exported.json();
  expect(json.email).toBe(newEmail);
  expect(json.profile.username).toBe(username);
  const raw = JSON.stringify(json);
  expect(raw).not.toContain("password");
  expect(raw).not.toContain("visitorHash");
  expect((await request.get("/dashboard/settings/export", { maxRedirects: 0 })).status()).not.toBe(200);

  // Deletion needs the exact username.
  await page.goto("/dashboard/settings");
  await page.getByRole("button", { name: "Hesabımı sil" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("wrong-name");
  await expect(dialog.getByRole("button", { name: "Hesabı sil", exact: true })).toBeDisabled();
  await dialog.getByRole("textbox").fill(username);
  const deleted = Date.now();
  await dialog.getByRole("button", { name: "Hesabı sil", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  // Offline at once, with a mail that explains the waiting period.
  expect((await request.get(`/${username}`)).status()).toBe(404);
  expect(await lastMail(newEmail, "accountDeletionScheduled", deleted)).toContain("/login");

  // Signing in during the waiting period offers the restore instead of the editor; restoring brings the page back.
  await login(page, newEmail, "brand-new-pass-2");
  await expect(page.getByRole("heading", { name: "Hesabın silinmek üzere" })).toBeVisible();
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Hesabın silinmek üzere" })).toBeVisible();
  await page.getByRole("button", { name: "Hesabımı geri yükle" }).click();
  await expect(page.getByRole("heading", { name: "Sayfan" })).toBeVisible();
  expect((await request.get(`/${username}`)).status()).toBe(200);
});

test("settings open for a session that is days old (Better Auth 'session is not fresh')", async ({ page }) => {
  const username = `old-${uid()}`;
  const { email } = await createUser(page, username);
  await sql(`UPDATE "session" SET "createdAt" = now() - interval '3 days' WHERE "userId" = (SELECT id FROM "user" WHERE email = $1)`, [email]);
  const response = await page.goto("/dashboard/settings");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Bu cihaz")).toBeVisible();
});
