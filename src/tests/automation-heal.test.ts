import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultConfig } from '../core/config.js';
import {
  applyHealsToMetadata,
  getAutomationByName,
  writeAutomationMetadata
} from '../core/automation.js';
import type { HealEvent } from '../types/heal.js';

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function scaffold() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'clickcron-heal-'));
  dirs.push(dir);
  const config = createDefaultConfig(dir);
  await mkdir(config.paths.automations, { recursive: true });
  await writeAutomationMetadata(config, {
    name: 'price-checker',
    browser: 'chromium',
    timeoutMs: 30000,
    selectors: {
      buy: { key: 'buy', description: 'Buy button', strategies: [{ kind: 'css', value: '#buy' }] }
    }
  });
  return config;
}

describe('applyHealsToMetadata', () => {
  it('promotes the healed strategy to the front and keeps prior ones as fallbacks', async () => {
    const config = await scaffold();
    const heal: HealEvent = {
      key: 'buy',
      description: 'Buy button',
      before: [{ kind: 'css', value: '#buy' }],
      after: { kind: 'css', value: '#buy-v2' },
      model: 'claude-haiku-4-5',
      at: new Date().toISOString()
    };

    await applyHealsToMetadata(config, 'price-checker', [heal]);
    const updated = await getAutomationByName(config, 'price-checker');

    expect(updated.selectors?.buy?.strategies[0]).toEqual({ kind: 'css', value: '#buy-v2' });
    expect(updated.selectors?.buy?.strategies).toContainEqual({ kind: 'css', value: '#buy' });
  });

  it('creates a selector entry when the heal is for a new key', async () => {
    const config = await scaffold();
    const heal: HealEvent = {
      key: 'newly-seen',
      before: [{ kind: 'css', value: '.gone' }],
      after: { kind: 'testId', value: 'cta' },
      model: 'claude-haiku-4-5',
      at: new Date().toISOString()
    };

    await applyHealsToMetadata(config, 'price-checker', [heal]);
    const updated = await getAutomationByName(config, 'price-checker');
    expect(updated.selectors?.['newly-seen']?.strategies[0]).toEqual({
      kind: 'testId',
      value: 'cta'
    });
  });
});
