import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: /.*\.e2e\.ts/,
  fullyParallel: true,
  use: {
    headless: true,
    trace: 'on-first-retry'
  }
});
