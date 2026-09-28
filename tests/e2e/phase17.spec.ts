import { expect, test } from "@playwright/test";

test.use({ locale: "tr-TR" });

test("the landing phone takes the typed name and a picked theme", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "the palette sits beside the phone on wide screens");
  await page.goto("/");
  const stage = page.locator("[aria-hidden] .transform-3d").first();

  // Typing in the claim bar renames the sample phone and keeps the second claim bar in step.
  await page.locator("#claim").fill("Deniz Yıldız");
  await expect(stage).toContainText("deniz.yildiz");
  await expect(stage).toContainText("/deniz.yildiz");
  await expect(page.locator("#claim-bottom")).toHaveValue("deniz.yildiz");

  // A swatch dresses the phone in that theme's real profile CSS.
  const kum = page.getByRole("group", { name: "Tema" }).getByRole("button", { name: "Kum" });
  // The palette drifts with the phone until the pointer rests on it.
  await kum.hover({ force: true });
  await kum.click();
  await expect(kum).toHaveAttribute("aria-pressed", "true");
  await expect(stage.locator('[data-font="serif"][data-button="solid"]').first()).toBeAttached();
});

test("questions open and close without JavaScript help", async ({ page }) => {
  await page.goto("/");
  const second = page.locator("details").nth(1);
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
  await expect(second.locator("p")).toContainText("Çerez kullanmadan");
});

test("the English landing carries the same sections", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 2, name: "Seven themes, all yours." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Questions" })).toBeAttached();
  await expect(page.getByText("No locked features · No trial · Your data is never sold")).toBeVisible();
});
