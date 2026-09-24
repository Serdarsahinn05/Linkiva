import { expect, test } from "@playwright/test";

// Regression guard: no page may scroll sideways on a phone (the landing hero once did).
test.use({ locale: "tr-TR" });
for (const path of ["/", "/login", "/register", "/privacy", "/nope/here"]) {
  test(`no horizontal overflow on ${path}`, async ({ page }, info) => {
    test.skip(info.project.name !== "mobile");
    await page.goto(path);
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(scroll).toBeLessThanOrEqual(client);
  });
}
