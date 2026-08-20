import { defineConfig } from "@playwright/test";

/**
 * Requires anvil running with the full kernel deployed (see
 * packages/sdk/examples/quickstart.ts's header for the exact deploy steps)
 * and apps/api running on LOCAL_API_URL (packages/config) before running
 * `npm run e2e` -- this config only manages the frontend dev server itself,
 * not its backing chain/API, same split as every manual verification this
 * repo has used all along.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
