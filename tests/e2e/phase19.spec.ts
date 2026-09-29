import { expect, test } from "@playwright/test";
import { sql } from "./db";
import { createUser, uid } from "./helpers";

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
