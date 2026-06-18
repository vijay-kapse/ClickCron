# Form Checker

Use this recipe to smoke test a form you own without waiting for someone to discover it is broken.

## Best For

- contact forms
- newsletter signup forms
- lead capture pages
- internal request forms

## Record It

```bash
clickcron init
clickcron record form-checker https://example.com/contact
```

In the recorder:

1. Fill safe test values into each field.
2. Submit to a staging endpoint, test inbox, or non-production target.
3. Assert that the success state appears.
4. Save the flow.

## Harden The Script

Use accessible labels and test-only input values:

```ts
import { expect, test } from '@playwright/test';

test('contact form accepts a test submission', async ({ page }) => {
  await page.goto('https://example.com/contact');

  await page.getByLabel(/name/i).fill('ClickCron Test');
  await page.getByLabel(/email/i).fill('clickcron-test@example.com');
  await page.getByLabel(/message/i).fill('Automated smoke test. Safe to ignore.');
  await page.getByRole('button', { name: /send|submit/i }).click();

  await expect(page.getByText(/thank you|received|success/i)).toBeVisible();
});
```

## Run It

```bash
clickcron run form-checker
clickcron schedule form-checker daily
```

## What To Watch

- Do not automate real user accounts without permission.
- Point submissions at a test endpoint or safe inbox.
- Keep API keys, auth cookies, and tokens in environment variables or GitHub Actions Secrets.
- Add cleanup if the form creates records in a database.

## Expected Artifacts

- form submission log
- success/failure result file
- screenshots for failed submit states
- scheduled GitHub Actions workflow

## Run it locally

This folder ships a ready-to-run starter under `automations/`. Copy the folder, then run:

```bash
npx clickcron run form-checker
```

Selectors self-heal automatically when `ANTHROPIC_API_KEY` is set: if the recorded
strategies stop matching, ClickCron asks Claude to relocate the element, verifies the
repair, and continues. To proactively repair selectors before a scheduled run:

```bash
npx clickcron heal form-checker
```
