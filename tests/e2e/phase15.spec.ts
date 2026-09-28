import { expect, test } from "@playwright/test";
import { uid } from "./helpers";

test.skip(({ isMobile }) => isMobile, "runs once on desktop");

test.describe("site pages have a fixed language by address", () => {
  test.use({ locale: "en-US" });

  test("/ stays Turkish for an English browser, offers English, and the choice carries into sign-up", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("tek bir adreste");

    await expect(page.getByText("This page is also in English.")).toBeVisible();
    await page.getByRole("button", { name: "Switch to English" }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("This page is also in English.")).toHaveCount(0);
    expect((await context.cookies()).find((c) => c.name === "NEXT_LOCALE")?.value).toBe("en");

    await page.goto("/register");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("hreflang and canonical point at both addresses", async ({ page }) => {
    await page.goto("/en/privacy");
    const href = (sel: string) => page.locator(`head ${sel}`).getAttribute("href");
    expect(await href('link[rel="canonical"]')).toMatch(/\/en\/privacy$/);
    expect(await href('link[rel="alternate"][hreflang="tr"]')).toMatch(/[^n]\/privacy$/);
    expect(await href('link[rel="alternate"][hreflang="en"]')).toMatch(/\/en\/privacy$/);
    expect(await href('link[rel="alternate"][hreflang="x-default"]')).toMatch(/[^n]\/privacy$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Notice");
    // Footer links stay in the page's language.
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "/en/terms");
  });

  test("the sitemap lists both languages of every site page", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/en", "/privacy", "/en/privacy", "/terms", "/en/terms"]) expect(xml).toContain(`${path}</loc>`);
    expect(xml).toMatch(/hreflang="en"[^>]*href="[^"]*\/en\/terms"/);
  });

  test("a header sent by the visitor cannot pick the language", async ({ request }) => {
    const html = await (await request.get("/register", { headers: { "x-linkiva-locale": "tr", "accept-language": "en-US" } })).text();
    expect(html).toContain('lang="en"');
  });

  test("an unused address invites the visitor to claim it, in their language", async ({ page }) => {
    const name = `free-${uid()}`;
    const res = await page.goto(`/${name}`);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nobody lives here yet.");
    await expect(page.getByText(`If nobody has ${name} yet, it could be yours.`)).toBeVisible();
    await expect(page.getByLabel("Your username")).toHaveValue(name);
    await page.getByRole("button", { name: "Claim this address" }).click();
    await expect(page).toHaveURL(new RegExp(`/register\\?username=${name}`));
  });

  test("the global 404 speaks the visitor's language too", async ({ page }) => {
    const res = await page.goto("/nope/nothing/here");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page does not exist.");
  });
});

test.describe("without JavaScript", () => {
  test.use({ locale: "tr-TR", javaScriptEnabled: false });

  test("the footer switch opens the same page in the other language", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByText("This page is also in English.")).toHaveCount(0);
    await page.getByRole("contentinfo").getByRole("button", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/terms$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of Use");
  });
});
