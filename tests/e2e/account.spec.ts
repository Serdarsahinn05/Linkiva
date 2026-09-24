import { expect, test, type Page } from "@playwright/test";
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

  // Email change: confirmation goes to the new address; the old one keeps working until then (v1 bug S4).
  await page.goto("/dashboard/settings");
  const requested = Date.now();
  await page.getByLabel("Yeni e-posta").fill(newEmail);
  await page.getByRole("button", { name: "Doğrulama linki gönder" }).click();
  await expect(page.getByText(`${newEmail} adresine bir onay linki gönderdik`)).toBeVisible();
  const confirmUrl = await lastMail(newEmail, "changeEmail", requested);

  await page.context().clearCookies();
  await login(page, email, "correct-horse-1");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(confirmUrl);
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
  await expect(dialog.getByRole("button", { name: "Hesabı kalıcı olarak sil" })).toBeDisabled();
  await dialog.getByRole("textbox").fill(username);
  await dialog.getByRole("button", { name: "Hesabı kalıcı olarak sil" }).click();
  await expect(page).toHaveURL(/\/$/);

  // Gone: public page 404, and the credentials no longer work.
  expect((await request.get(`/${username}`)).status()).toBe(404);
  await login(page, newEmail, "brand-new-pass-2");
  await expect(page.getByRole("alert").filter({ hasText: "E-posta veya şifre hatalı." })).toBeVisible();
});
