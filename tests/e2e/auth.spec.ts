import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

// Auth endpoints are rate limited per IP; run this flow once (desktop) rather than per device.
test.skip(({ browserName, isMobile }) => isMobile || browserName !== "chromium", "auth flow runs once on desktop");
test.use({ locale: "tr-TR" });

const mailbox = join(process.cwd(), "tmp", "mailbox");

async function lastMail(to: string, kind: string, after: number): Promise<string> {
  const file = join(mailbox, `${to}.json`);
  let url = "";
  await expect
    .poll(
      async () => {
        try {
          const mail = JSON.parse(await readFile(file, "utf8"));
          if (mail.kind === kind && Date.parse(mail.sentAt) >= after) url = mail.url;
        } catch {
          /* not written yet */
        }
        return url;
      },
      { timeout: 15_000 },
    )
    .not.toBe("");
  return url;
}

async function fillPassword(page: Page, value: string) {
  await page.getByLabel(/^(Şifre|Yeni şifre)$/).fill(value);
}

test("register → verify → onboarding → dashboard, then log out and back in", async ({ page }) => {
  const id = Date.now().toString(36);
  const email = `e2e-${id}@example.com`;
  const password = "correct-horse-1";
  const username = `e2e-${id}`;

  // Protected pages bounce to login.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  // Register.
  const started = Date.now();
  await page.goto("/register");
  await page.getByLabel("E-posta").fill(email);
  await fillPassword(page, password);
  await page.getByRole("button", { name: "Hesap oluştur" }).click();
  await expect(page).toHaveURL(/\/check-email/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gelen kutuna bak.");

  // Logging in before verifying is refused with the "verify first" notice.
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(email);
  await fillPassword(page, password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByRole("status").filter({ hasText: "doğrulaman gerekiyor" })).toBeVisible();

  // Verify via the mailed link: auto sign-in, then onboarding.
  await page.goto(await lastMail(email, "verify", started));
  await expect(page).toHaveURL(/\/onboarding/);

  // Reserved names are refused before submit.
  const field = page.getByLabel("Kullanıcı adı");
  await field.fill("dashboard");
  await expect(page.getByText("Bu ad ayrılmış")).toBeVisible();

  await field.fill(username);
  await expect(page.getByText(`${username} boşta.`)).toBeVisible();
  await page.getByLabel("Görünen ad").fill("E2E Test");
  await page.getByRole("button", { name: "Sayfamı yayınla" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(`${new URL(page.url()).host}/${username}`)).toBeVisible();

  // Onboarding is done: visiting it again goes to the dashboard.
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/dashboard$/);

  // Log out, fail with a wrong password (generic message), then log in.
  await page.getByRole("button", { name: "Çıkış yap" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("E-posta").fill(email);
  await fillPassword(page, "wrong-password");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "E-posta veya şifre hatalı." })).toBeVisible();
  await fillPassword(page, password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("sign-up with an existing email looks identical (no account enumeration)", async ({ page }) => {
  const email = `e2e-dupe-${Date.now().toString(36)}@example.com`;
  for (let i = 0; i < 2; i++) {
    await page.goto("/register");
    await page.getByLabel("E-posta").fill(email);
    await fillPassword(page, "correct-horse-1");
    await page.getByRole("button", { name: "Hesap oluştur" }).click();
    await expect(page).toHaveURL(/\/check-email/);
  }
});

test("password reset: same answer for unknown emails, working link for real ones", async ({ page }) => {
  const id = Date.now().toString(36);
  const email = `e2e-reset-${id}@example.com`;

  // Create and verify an account.
  const started = Date.now();
  await page.goto("/register");
  await page.getByLabel("E-posta").fill(email);
  await fillPassword(page, "old-password-1");
  await page.getByRole("button", { name: "Hesap oluştur" }).click();
  await page.goto(await lastMail(email, "verify", started));
  await expect(page).toHaveURL(/\/onboarding/);
  await page.context().clearCookies();

  // Unknown address: same success message.
  await page.goto("/forgot-password");
  await page.getByLabel("E-posta").fill(`nobody-${id}@example.com`);
  await page.getByRole("button", { name: "Link gönder" }).click();
  await expect(page.getByRole("status")).toContainText("hesap varsa");

  // Real address: follow the link and set a new password.
  const requested = Date.now();
  await page.goto("/forgot-password");
  await page.getByLabel("E-posta").fill(email);
  await page.getByRole("button", { name: "Link gönder" }).click();
  await expect(page.getByRole("status")).toContainText("hesap varsa");
  await page.goto(await lastMail(email, "reset", requested));
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  await fillPassword(page, "new-password-1");
  await page.getByRole("button", { name: "Şifreyi güncelle" }).click();
  await expect(page).toHaveURL(/\/login\?reset=1/);
  await expect(page.getByRole("status")).toContainText("Şifren güncellendi");

  await page.getByLabel("E-posta").fill(email);
  await fillPassword(page, "new-password-1");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
});
