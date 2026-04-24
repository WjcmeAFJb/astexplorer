import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:8080',
  },
  webServer: {
    // Self-contained: builds the website with Vite, then serves it.
    command: 'cd packages/website && npx vite build --mode development && cd ../.. && npx serve -l 8080 out',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000, // build can take several minutes
  },
});
