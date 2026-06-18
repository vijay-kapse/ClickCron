import { expect, test } from '@playwright/test';
import { cc } from 'clickcron/runtime';

// Point this at a staging form or a safe test inbox, never production data.
const FORM_URL = 'https://example.com/contact';

test('contact form accepts a safe test submission', async ({ page }) => {
  await page.goto(FORM_URL);

  // Fill the name field. Each cc() call self-heals if the label/markup moves.
  await cc(page, {
    key: 'name-field',
    description: 'The full name input on the contact form',
    strategies: [
      { kind: 'label', value: 'Name' },
      { kind: 'placeholder', value: 'Your name' },
      { kind: 'css', value: 'input[name="name"]' }
    ]
  }).fill('ClickCron Test');

  // Fill the email field with a clearly disposable test address.
  await cc(page, {
    key: 'email-field',
    description: 'The email address input on the contact form',
    strategies: [
      { kind: 'label', value: 'Email' },
      { kind: 'placeholder', value: 'you@example.com' },
      { kind: 'css', value: 'input[type="email"]' }
    ]
  }).fill('clickcron-test@example.com');

  // Submit the form.
  await cc(page, {
    key: 'submit-button',
    description: 'The submit / send button at the bottom of the form',
    strategies: [
      { kind: 'role', value: 'button', name: 'Send' },
      { kind: 'role', value: 'button', name: 'Submit' },
      { kind: 'css', value: 'button[type="submit"]' }
    ]
  }).click();

  // Confirm the success state appears after submitting.
  const success = cc(page, {
    key: 'success-message',
    description: 'The confirmation message shown after a successful submission',
    strategies: [
      { kind: 'text', value: 'Thank you' },
      { kind: 'testId', value: 'form-success' },
      { kind: 'role', value: 'status' }
    ]
  });
  expect(await success.isVisible()).toBe(true);
});
