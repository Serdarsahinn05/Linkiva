import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
// PW_CHANNEL=chrome uses the locally installed Chrome when the bundled browser cannot be downloaded.
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium", channel } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, channel } },
  ],
  webServer: {
    command: "npm run dev",
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
