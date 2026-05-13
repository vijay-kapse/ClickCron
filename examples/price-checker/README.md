# Price Checker

Use this recipe to watch a product page for price, inventory, or promo changes.

## Best For

- product pages where price changes matter
- inventory drops and back-in-stock checks
- checkout smoke tests for your own store
- daily snapshots of competitor-visible public pages

## Record It

```bash
clickcron init
clickcron record price-checker https://example.com/products/widget
```

In the Playwright recorder:

1. Wait for the product title and price to appear.
2. Click any selector, size, or variant that matters.
3. Add assertions for the visible price, stock label, or CTA.
4. Save and close the recorder.

## Harden The Script

After recording, open the generated `automations/price-checker.spec.ts` and replace brittle clicks with semantic locators:

```ts
import { expect, test } from '@playwright/test';

test('product page shows expected buying state', async ({ page }) => {
  await page.goto('https://example.com/products/widget');

  await expect(page.getByRole('heading', { name: /widget/i })).toBeVisible();
  await expect(page.getByText(/\$\d+/)).toBeVisible();
  await expect(page.getByRole('button', { name: /add to cart|notify me/i })).toBeVisible();
});
```

## Run It

```bash
clickcron run price-checker
clickcron schedule price-checker daily
```

## What To Watch

- Avoid hardcoding secrets, checkout credentials, or real payment flows.
- Prefer stable selectors like roles, labels, and `data-testid`.
- Keep assertions focused on the signal you care about: price visible, stock state, or CTA availability.
- Use GitHub Actions Secrets for any authenticated checks.

## Expected Artifacts

- run log with Playwright output
- `result.json` with success/failure metadata
- screenshots for debugging visual changes
- generated GitHub Actions workflow for scheduled checks
