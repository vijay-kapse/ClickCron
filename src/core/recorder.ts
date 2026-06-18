import { readFile, writeFile } from 'node:fs/promises';
import { execa } from './process.js';
import type { ClickCronConfig } from '../types/config.js';
import { getAutomationPaths, writeAutomationMetadata } from './automation.js';
import { transformSpec } from './transform.js';
import { CliError } from './errors.js';

export interface RecordAutomationOptions {
  name: string;
  url?: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  timeoutMs: number;
}

export interface RecordAutomationResult {
  scriptPath: string;
  /** Number of locators converted to self-healing `cc()` calls. */
  healableSelectors: number;
}

function supportsOutputFlag(helpText: string): boolean {
  return helpText.includes('--output');
}

/**
 * Capture a recorded flow with Playwright codegen, then rewrite its locators
 * into ClickCron's self-healing `cc()` calls and capture the selector
 * candidates into metadata.
 */
export async function recordAutomation(
  config: ClickCronConfig,
  options: RecordAutomationOptions
): Promise<RecordAutomationResult> {
  const { scriptPath } = getAutomationPaths(config, options.name);
  const help = await execa('npx', ['playwright', 'codegen', '--help'], { reject: false });
  const hasOutput = supportsOutputFlag(help.stdout);

  if (hasOutput) {
    const args = ['playwright', 'codegen', '--browser', options.browser, '--output', scriptPath];
    if (options.url) args.push(options.url);
    await execa('npx', args, { stdio: 'inherit' });
  } else {
    // Older codegen lacks --output: capture the generated script from stdout
    // instead of leaving a dead placeholder behind.
    const args = ['playwright', 'codegen', '--browser', options.browser];
    if (options.url) args.push(options.url);
    const recorded = await execa('npx', args, { reject: false });
    const script = recorded.stdout.trim();
    if (!script) {
      throw new CliError(
        'Playwright codegen produced no script. Re-run and interact with the page before closing the recorder.'
      );
    }
    await writeFile(scriptPath, `${script}\n`, 'utf8');
  }

  const raw = await readFile(scriptPath, 'utf8');
  const transformed = transformSpec(raw);
  if (transformed.rewrites > 0) {
    await writeFile(scriptPath, transformed.code, 'utf8');
  }

  await writeAutomationMetadata(config, {
    name: options.name,
    browser: options.browser,
    timeoutMs: options.timeoutMs,
    ...(options.url !== undefined ? { sourceUrl: options.url } : {}),
    ...(transformed.rewrites > 0 ? { selectors: transformed.selectors } : {})
  });

  return { scriptPath, healableSelectors: transformed.rewrites };
}
