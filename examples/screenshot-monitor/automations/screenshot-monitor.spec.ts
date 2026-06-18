import { test } from '@playwright/test';
import { cc } from 'clickcron/runtime';

// Replace this with the page you want to snapshot on a schedule.
const PAGE_URL = 'https://example.com';

test('capture a screenshot once the page has settled', async ({ page }) => {
  // A fixed viewport keeps screenshots comparable from run to run.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(PAGE_URL);

  // Wait for above-the-fold content so the snapshot is not half-rendered.
  // Selectors self-heal if the heading markup changes.
  await cc(page, {
    key: 'hero-heading',
    description: 'The primary above-the-fold heading on the landing page',
    strategies: [
      { kind: 'role', value: 'heading', name: 'Example Domain' },
      { kind: 'testId', value: 'hero-heading' },
      { kind: 'css', value: 'main h1' }
    ]
  }).waitFor();

  // Capture a full-page screenshot. ClickCron stores artifacts per run.
  await page.screenshot({ path: 'screenshot-monitor.png', fullPage: true });
});
