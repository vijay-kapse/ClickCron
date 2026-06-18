import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { extractJson, healSelector } from '../core/ai.js';
import type { SelectorCandidate } from '../types/heal.js';

const candidate: SelectorCandidate = {
  key: 'buy-button',
  strategies: [{ kind: 'css', value: '#buy' }]
};

describe('extractJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON inside a fenced code block with prose', () => {
    const text =
      'Here is the fix:\n```json\n{ "strategy": { "kind": "css", "value": "#x" } }\n```\nDone.';
    expect(extractJson(text)).toEqual({ strategy: { kind: 'css', value: '#x' } });
  });

  it('returns null for non-JSON text', () => {
    expect(extractJson('no json here')).toBeNull();
  });
});

describe('healSelector', () => {
  const created: string[] = [];

  afterEach(async () => {
    delete process.env.CLICKCRON_HEAL_FAKE;
    delete process.env.ANTHROPIC_API_KEY;
    await Promise.all(created.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('returns null when no API key and no fake oracle are configured', async () => {
    const result = await healSelector({ candidate, elements: [], model: 'claude-haiku-4-5' });
    expect(result).toBeNull();
  });

  it('uses the offline fake oracle when set', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'clickcron-ai-'));
    created.push(dir);
    const fake = path.join(dir, 'fake.json');
    await writeFile(
      fake,
      JSON.stringify({ 'buy-button': { kind: 'css', value: '#buy-v2' } }),
      'utf8'
    );
    process.env.CLICKCRON_HEAL_FAKE = fake;

    const result = await healSelector({ candidate, elements: [], model: 'claude-haiku-4-5' });
    expect(result?.strategy).toEqual({ kind: 'css', value: '#buy-v2' });
  });

  it('rejects malformed oracle entries', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'clickcron-ai-'));
    created.push(dir);
    const fake = path.join(dir, 'fake.json');
    await writeFile(fake, JSON.stringify({ 'buy-button': { kind: 'bogus', value: '' } }), 'utf8');
    process.env.CLICKCRON_HEAL_FAKE = fake;

    const result = await healSelector({ candidate, elements: [], model: 'claude-haiku-4-5' });
    expect(result).toBeNull();
  });
});
