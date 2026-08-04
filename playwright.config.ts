import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  // Tests hardcode http://localhost:39755 — start the dev server automatically.
  // NOTE: @astrojs/cloudflare does NOT support `astro preview`, so use `astro dev`.
  webServer: {
    command: 'npx astro dev --port 39755',
    url: 'http://localhost:39755/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:39755',
  },
});
