import { expect, test } from '@playwright/test';
import { cc } from 'clickcron/runtime';

// Replace this with the careers page or saved search you want to watch.
const BOARD_URL = 'https://example.com/careers';

test('job board shows at least one visible listing', async ({ page }) => {
  await page.goto(BOARD_URL);

  // Wait for the listings container to finish loading. Selectors self-heal.
  const list = cc(page, {
    key: 'job-list',
    description: 'The container that holds the rendered job listings',
    strategies: [
      { kind: 'testId', value: 'job-list' },
      { kind: 'role', value: 'list' },
      { kind: 'css', value: 'main ul, main ol' }
    ]
  });
  await list.waitFor();

  // Read the first listing's text and assert it is non-empty.
  const firstJob = await cc(page, {
    key: 'first-job',
    description: 'The first job listing row in the results',
    strategies: [
      { kind: 'testId', value: 'job-item' },
      { kind: 'role', value: 'listitem' },
      { kind: 'css', value: 'main li' }
    ]
  }).innerText();

  expect(firstJob.trim().length).toBeGreaterThan(0);
});
