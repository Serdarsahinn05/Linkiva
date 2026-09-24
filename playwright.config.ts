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
    // PW_PROD=1 runs against a production build (npm run build first): real caching/ISR behaviour.
    command: process.env.PW_PROD ? "npm run start" : "npm run dev",
    env: { E2E: "1" },
    port,
    // Never reuse a manually started server: it would lack the E2E flag.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
