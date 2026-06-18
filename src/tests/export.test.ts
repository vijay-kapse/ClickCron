import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultConfig } from '../core/config.js';
import { writeAutomationMetadata } from '../core/automation.js';
import { buildRecipe, serializeRecipe } from '../core/export.js';

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function scaffold() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'clickcron-export-'));
  dirs.push(dir);
  const config = createDefaultConfig(dir);
  await mkdir(config.paths.automations, { recursive: true });
  await writeAutomationMetadata(config, {
    name: 'price-checker',
    browser: 'chromium',
    timeoutMs: 30000,
    sourceUrl: 'https://example.com',
    selectors: {
      buy: { key: 'buy', description: 'Buy button', strategies: [{ kind: 'css', value: '#buy' }] }
    }
  });
  const scriptPath = path.join(config.paths.automations, 'price-checker.spec.ts');
  await writeFile(scriptPath, "import { test } from '@playwright/test';\n// recipe body\n", 'utf8');
  return config;
}

describe('buildRecipe', () => {
  it('bundles metadata, selectors, and the spec source', async () => {
    const config = await scaffold();
    const recipe = await buildRecipe(config, 'price-checker');

    expect(recipe.name).toBe('price-checker');
    expect(recipe.sourceUrl).toBe('https://example.com');
    expect(recipe.selectors.buy?.strategies[0]).toEqual({ kind: 'css', value: '#buy' });
    expect(recipe.script).toContain('recipe body');
    expect(recipe.exportedBy).toBe('clickcron');
  });
});

describe('serializeRecipe', () => {
  it('emits valid JSON', async () => {
    const config = await scaffold();
    const recipe = await buildRecipe(config, 'price-checker');
    const json = serializeRecipe(recipe, 'json');
    expect(JSON.parse(json)).toMatchObject({ name: 'price-checker' });
  });

  it('emits YAML with a block scalar for the script', async () => {
    const config = await scaffold();
    const recipe = await buildRecipe(config, 'price-checker');
    const yaml = serializeRecipe(recipe, 'yaml');
    expect(yaml).toContain('name: price-checker');
    expect(yaml).toContain('script: |');
    expect(yaml).toContain('selectors:');
  });
});
