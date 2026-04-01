import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:8080',
  },
  webServer: {
    // Self-contained: builds the website from scratch, then serves it.
    // This verifies the full build pipeline, making it safe to swap bundlers later.
    command: 'cd website && NODE_OPTIONS=--openssl-legacy-provider npx cross-env NODE_ENV=development npx webpack -d --mode=development && cd .. && npx serve -l 8080 out',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000, // build can take several minutes
  },
});
