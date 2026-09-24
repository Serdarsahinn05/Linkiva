import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";

const mailbox = join(process.cwd(), "tmp", "mailbox");

/** Polls the dev mailbox (lib/mail/send.ts) for the latest mail of a kind sent after a timestamp. */
export async function lastMail(to: string, kind: string, after: number): Promise<string> {
  let url = "";
  await expect
    .poll(
      async () => {
        try {
          const mail = JSON.parse(await readFile(join(mailbox, `${to}.json`), "utf8"));
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

export const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/** Registers, verifies and onboards a fresh user; leaves the page on /dashboard. */
export async function createUser(page: Page, username: string) {
  const email = `${username}@example.com`;
  const started = Date.now();
  await page.goto("/register");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill("correct-horse-1");
  await page.getByRole("button", { name: "Hesap oluştur" }).click();
  await expect(page).toHaveURL(/\/check-email/);
  await page.goto(await lastMail(email, "verify", started));
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Kullanıcı adı").fill(username);
  await expect(page.getByText(`${username} boşta.`)).toBeVisible();
  await page.getByRole("button", { name: "Sayfamı yayınla" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return { email };
}
