# Screenshot Monitor

Use this recipe to capture a page state on a schedule and keep screenshots with every run.

## Best For

- landing page smoke checks
- dashboard visual sanity checks
- marketing page regression snapshots
- status pages or public docs you own

## Record It

```bash
clickcron init
clickcron record screenshot-monitor https://example.com
```

In the recorder:

1. Visit the page state you care about.
2. Dismiss banners or modals that would hide the content.
3. Wait for important above-the-fold content.
4. Save the flow.

## Harden The Script

Add a stable viewport and assertions before the screenshot is captured:

```ts
import { expect, test } from '@playwright/test';

test('homepage visual state is available', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('https://example.com');

  await expect(page.getByRole('heading', { name: /example/i })).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
});
```

## Run It

```bash
clickcron run screenshot-monitor
clickcron schedule screenshot-monitor hourly
```

## What To Watch

- Disable or handle cookie banners before asserting page state.
- Wait for network-heavy dashboards to settle before checking content.
- Use consistent viewport sizes so screenshot comparisons are easier.
- Keep generated screenshots out of git; ClickCron stores them under ignored artifact paths.

## Expected Artifacts

- timestamped screenshot
- run log
- `result.json`
- optional GitHub Actions artifact upload for scheduled runs
