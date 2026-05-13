# Job Board Monitor

Use this recipe to watch a job board, careers page, or saved search for new visible listings.

## Best For

- company careers pages
- public job search URLs
- internal hiring dashboards you own
- niche job boards with slow-moving listings

## Record It

```bash
clickcron init
clickcron record job-board-monitor https://example.com/careers
```

In the recorder:

1. Open the saved search or careers page.
2. Apply filters like role, location, remote status, or team.
3. Wait for listings to finish loading.
4. Assert that the results area is visible.
5. Save the flow.

## Harden The Script

Assert the page shape instead of exact result counts, unless counts are the signal:

```ts
import { expect, test } from '@playwright/test';

test('job board search loads listings', async ({ page }) => {
  await page.goto('https://example.com/careers');

  await expect(page.getByRole('heading', { name: /careers|jobs/i })).toBeVisible();
  await expect(page.locator('[data-testid="job-list"], main ul, main ol').first()).toBeVisible();
  await expect(page.getByText(/engineering|product|design|remote/i)).toBeVisible();
});
```

## Run It

```bash
clickcron run job-board-monitor
clickcron schedule job-board-monitor hourly
```

## What To Watch

- Respect robots, rate limits, and the site terms you operate under.
- Prefer scheduled checks that are gentle and infrequent.
- Store authenticated session state securely if the job board is private.
- Assert on stable page regions, not dynamic listing order.

## Expected Artifacts

- run log with listing page status
- `result.json`
- screenshots of the loaded search page
- scheduled workflow for repeated checks
