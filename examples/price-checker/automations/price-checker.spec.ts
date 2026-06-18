import { expect, test } from '@playwright/test';
import { cc } from 'clickcron/runtime';

// Replace this with the real product URL you want to watch.
const PRODUCT_URL = 'https://example.com/products/widget';

// Alert when the price drops to (or below) this value, in whole dollars.
const PRICE_THRESHOLD = 50;

test('product price is below the alert threshold', async ({ page }) => {
  await page.goto(PRODUCT_URL);

  // Make sure the product page actually rendered before reading the price.
  await cc(page, {
    key: 'product-title',
    description: 'The product name heading at the top of the page',
    strategies: [
      { kind: 'role', value: 'heading', name: 'Widget' },
      { kind: 'testId', value: 'product-title' },
      { kind: 'css', value: 'h1' }
    ]
  }).waitFor();

  // Read the visible price text. Selectors self-heal if the markup shifts.
  const priceText = await cc(page, {
    key: 'product-price',
    description: 'The current product price, shown near the buy button',
    strategies: [
      { kind: 'testId', value: 'product-price' },
      { kind: 'css', value: '[data-price]' },
      { kind: 'text', value: '$' }
    ]
  }).textContent();

  // Parse the first dollar amount out of whatever text we found.
  const price = Number((priceText ?? '').replace(/[^0-9.]/g, ''));
  expect(Number.isNaN(price)).toBe(false);
  expect(price).toBeLessThanOrEqual(PRICE_THRESHOLD);
});
