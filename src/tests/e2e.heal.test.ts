import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium, type Browser } from '@playwright/test';
import { cc, resolveCandidate, __resetHealCount } from '../runtime/index.js';
import type { HealEvent, SelectorCandidate } from '../types/heal.js';

// The recorded page used `#buy`; production shipped a redesign where the button
// id changed to `#buy-v2` and the price class changed to `.price-tag`.
const FIXTURE_HTML = `<!doctype html>
<html><body>
  <h1>Demo Store</h1>
  <button id="buy-v2" onclick="document.getElementById('out').textContent='bought'">Buy now</button>
  <span class="price-tag">$42.00</span>
  <div id="out"></div>
</body></html>`;

let browser: Browser;
let tmpDir: string;
let fixtureUrl: string;
let healLogPath: string;

beforeAll(async () => {
  browser = await chromium.launch();
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'clickcron-e2e-'));

  const fixturePath = path.join(tmpDir, 'store.html');
  await writeFile(fixturePath, FIXTURE_HTML, 'utf8');
  fixtureUrl = pathToFileURL(fixturePath).href;

  healLogPath = path.join(tmpDir, 'heals.jsonl');

  // Offline heal oracle: maps a broken selector key to the repaired strategy,
  // so the full heal loop runs end-to-end without an API key.
  const fakePath = path.join(tmpDir, 'heal-fake.json');
  await writeFile(
    fakePath,
    JSON.stringify({
      'buy-button': { kind: 'css', value: '#buy-v2' },
      price: { kind: 'css', value: '.price-tag' }
    }),
    'utf8'
  );

  process.env.CLICKCRON_HEAL_FAKE = fakePath;
  process.env.CLICKCRON_HEAL_LOG = healLogPath;
  process.env.CLICKCRON_HEAL_MAX = '5';
  delete process.env.CLICKCRON_NO_HEAL;
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await rm(tmpDir, { recursive: true, force: true });
  delete process.env.CLICKCRON_HEAL_FAKE;
  delete process.env.CLICKCRON_HEAL_LOG;
  delete process.env.CLICKCRON_HEAL_MAX;
});

async function readHeals(): Promise<HealEvent[]> {
  const raw = await readFile(healLogPath, 'utf8').catch(() => '');
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as HealEvent);
}

describe('self-healing runtime (e2e)', () => {
  it('resolves a working selector without healing', async () => {
    __resetHealCount();
    const page = await browser.newPage();
    await page.goto(fixtureUrl);

    const candidate: SelectorCandidate = {
      key: 'buy-button',
      description: 'The primary Buy now button',
      strategies: [{ kind: 'role', value: 'button', name: 'Buy now' }]
    };
    await cc(page, candidate).click();

    expect(await page.locator('#out').textContent()).toBe('bought');
    expect(await readHeals()).toHaveLength(0);
    await page.close();
  });

  it('heals a broken selector and records the heal event', async () => {
    __resetHealCount();
    const page = await browser.newPage();
    await page.goto(fixtureUrl);

    // Every recorded strategy is stale (the id changed): healing must kick in.
    const candidate: SelectorCandidate = {
      key: 'buy-button',
      description: 'The primary Buy now button',
      strategies: [{ kind: 'css', value: '#buy' }]
    };
    await cc(page, candidate).click();

    expect(await page.locator('#out').textContent()).toBe('bought');

    const heals = await readHeals();
    expect(heals).toHaveLength(1);
    expect(heals[0]?.key).toBe('buy-button');
    expect(heals[0]?.after).toEqual({ kind: 'css', value: '#buy-v2' });
    await page.close();
  });

  it('reads text through a healed selector', async () => {
    __resetHealCount();
    const page = await browser.newPage();
    await page.goto(fixtureUrl);

    const price = await cc(page, {
      key: 'price',
      strategies: [{ kind: 'css', value: '.price' }]
    }).textContent();

    expect(price).toBe('$42.00');
    await page.close();
  });

  it('throws a clear error when healing cannot find a match', async () => {
    __resetHealCount();
    const page = await browser.newPage();
    await page.goto(fixtureUrl);

    await expect(
      resolveCandidate(page, {
        key: 'nonexistent',
        strategies: [{ kind: 'css', value: '#ghost' }]
      })
    ).rejects.toThrow(/could not heal/i);
    await page.close();
  });
});
