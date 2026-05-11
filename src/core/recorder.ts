import { writeFile } from 'node:fs/promises';
import { execa } from './process.js';
import type { ClickCronConfig } from '../types/config.js';
import { getAutomationPaths, writeAutomationMetadata } from './automation.js';
import { CliError } from './errors.js';

export interface RecordAutomationOptions {
  name: string;
  url?: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  timeoutMs: number;
}

function supportsOutputFlag(helpText: string): boolean {
  return helpText.includes('--output');
}

export async function recordAutomation(
  config: ClickCronConfig,
  options: RecordAutomationOptions
): Promise<void> {
  const { scriptPath } = getAutomationPaths(config, options.name);
  const help = await execa('npx', ['playwright', 'codegen', '--help']);
  const hasOutput = supportsOutputFlag(help.stdout);

  await writeAutomationMetadata(config, {
    name: options.name,
    browser: options.browser,
    timeoutMs: options.timeoutMs,
    ...(options.url !== undefined ? { sourceUrl: options.url } : {})
  });

  if (hasOutput) {
    const args = ['playwright', 'codegen', '--browser', options.browser, '--output', scriptPath];
    if (options.url) args.push(options.url);
    await execa('npx', args, { stdio: 'inherit' });
    return;
  }

  const placeholder = `import { test } from '@playwright/test';\n\ntest('recorded flow placeholder', async ({ page }) => {\n  // Your Playwright installation does not support --output for codegen.\n  // Run: npx playwright codegen ${options.url ?? '<url>'}\n  // Then paste generated script into this file.\n  await page.goto('${options.url ?? 'https://example.com'}');\n});\n`;

  await writeFile(scriptPath, placeholder, 'utf8');
  throw new CliError(
    `Your Playwright codegen does not support --output. Placeholder created at ${scriptPath}.`
  );
}
