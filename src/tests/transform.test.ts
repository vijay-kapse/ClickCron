import { describe, expect, it } from 'vitest';
import { transformSpec } from '../core/transform.js';

describe('transformSpec', () => {
  it('rewrites a getByRole click into a self-healing cc() call', () => {
    const source = [
      "import { test } from '@playwright/test';",
      '',
      "test('flow', async ({ page }) => {",
      "  await page.goto('https://example.com');",
      "  await page.getByRole('button', { name: 'Buy now' }).click();",
      '});'
    ].join('\n');

    const result = transformSpec(source);

    expect(result.rewrites).toBe(1);
    expect(result.code).toContain("import { cc } from 'clickcron/runtime';");
    expect(result.code).toContain('await cc(page,');
    expect(result.code).toContain('.click();');
    const candidate = Object.values(result.selectors)[0];
    expect(candidate?.strategies[0]).toEqual({
      kind: 'role',
      value: 'button',
      name: 'Buy now'
    });
  });

  it('captures fills, labels, test ids, and css selectors', () => {
    const source = [
      "await page.getByLabel('Email').fill('a@b.com');",
      "await page.getByTestId('submit').click();",
      "await page.locator('#price').click();",
      "await page.getByText('Add to cart', { exact: true }).click();"
    ].join('\n');

    const result = transformSpec(source);
    expect(result.rewrites).toBe(4);
    const kinds = Object.values(result.selectors).map((c) => c.strategies[0]?.kind);
    expect(kinds).toEqual(expect.arrayContaining(['label', 'testId', 'css', 'text']));
    const textCandidate = Object.values(result.selectors).find(
      (c) => c.strategies[0]?.kind === 'text'
    );
    expect(textCandidate?.strategies[0]?.exact).toBe(true);
  });

  it('leaves unrecognized lines untouched and adds no import', () => {
    const source = [
      "import { test, expect } from '@playwright/test';",
      "await page.getByRole('list').filter({ hasText: 'x' }).click();",
      "expect(await page.title()).toBe('Home');"
    ].join('\n');

    const result = transformSpec(source);
    expect(result.rewrites).toBe(0);
    expect(result.code).toBe(source);
    expect(result.code).not.toContain('clickcron/runtime');
  });

  it('produces unique keys for duplicate selectors', () => {
    const source = [
      "await page.getByRole('button', { name: 'Go' }).click();",
      "await page.getByRole('button', { name: 'Go' }).click();"
    ].join('\n');

    const result = transformSpec(source);
    expect(result.rewrites).toBe(2);
    expect(Object.keys(result.selectors)).toHaveLength(2);
  });
});
