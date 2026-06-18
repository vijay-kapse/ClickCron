import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execa } from './process.js';
import type { ClickCronConfig } from '../types/config.js';
import type { HealEvent } from '../types/heal.js';
import { applyHealsToMetadata, getAutomationByName } from './automation.js';
import { CliError } from './errors.js';

export interface HealRunResult {
  name: string;
  checked: number;
  heals: HealEvent[];
  logPath: string;
}

function buildValidationSpec(url: string, selectorsJson: string): string {
  return [
    "import { test } from '@playwright/test';",
    "import { cc } from 'clickcron/runtime';",
    '',
    `const selectors = ${selectorsJson};`,
    '',
    "test('clickcron heal', async ({ page }) => {",
    `  await page.goto(${JSON.stringify(url)});`,
    '  for (const candidate of selectors) {',
    '    await cc(page, candidate).resolve();',
    '  }',
    '});',
    ''
  ].join('\n');
}

async function readHealLog(logPath: string): Promise<HealEvent[]> {
  try {
    const raw = await readFile(logPath, 'utf8');
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as HealEvent);
  } catch {
    return [];
  }
}

/**
 * Re-validate every recorded selector against the live page and repair the ones
 * that no longer match — without running the recipe's assertions.
 */
export async function healAutomation(
  config: ClickCronConfig,
  name: string
): Promise<HealRunResult> {
  const automation = await getAutomationByName(config, name);
  const selectors = Object.values(automation.selectors ?? {});

  if (!automation.sourceUrl) {
    throw new CliError(
      `Cannot heal "${name}": no source URL was recorded. Re-record with a URL to enable proactive healing.`
    );
  }
  if (selectors.length === 0) {
    return { name: automation.name, checked: 0, heals: [], logPath: '' };
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(config.paths.runs, automation.name, `heal-${stamp}`);
  await mkdir(runDir, { recursive: true });

  const specPath = path.join(runDir, 'heal.spec.ts');
  const healLogPath = path.join(runDir, 'heals.jsonl');
  await writeFile(
    specPath,
    buildValidationSpec(automation.sourceUrl, JSON.stringify(selectors)),
    'utf8'
  );

  await execa('npx', ['playwright', 'test', specPath, '--output', runDir], {
    reject: false,
    env: {
      CLICKCRON_HEAL_LOG: healLogPath,
      CLICKCRON_HEAL_MODEL: config.heal.model,
      CLICKCRON_HEAL_MAX: String(config.heal.maxHealsPerRun)
    }
  });

  const heals = await readHealLog(healLogPath);
  if (heals.length > 0) {
    await applyHealsToMetadata(config, automation.name, heals);
  }

  return { name: automation.name, checked: selectors.length, heals, logPath: healLogPath };
}
