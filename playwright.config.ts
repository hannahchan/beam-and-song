import { defineConfig } from '@playwright/test';

/**
 * E2E smoke suite (tests/e2e) — covers what jsdom cannot: the real canvas
 * animating, fullscreen/audio unlock paths, gate flows, downloads, and
 * switch scanning against a production build.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5199',
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
  },
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 5199 --strictPort',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
