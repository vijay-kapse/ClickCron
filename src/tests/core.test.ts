import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDefaultConfig, validateConfig } from '../core/config.js';
import { readAutomationMetadata, writeAutomationMetadata } from '../core/automation.js';
import { resolveCronExpression, createScheduleWorkflow } from '../core/scheduler.js';
import { validateAutomationName } from '../core/validation.js';
import { CliError, toCliError } from '../core/errors.js';

describe('config validation/default generation', () => {
  it('creates default config rooted in cwd', () => {
    const config = createDefaultConfig('/tmp/project');
    expect(config.version).toBe(1);
    expect(config.paths.automations).toContain('/tmp/project/automations');
  });

  it('validates valid config and rejects invalid timeout', () => {
    expect(() => validateConfig(createDefaultConfig('/tmp/a'))).not.toThrow();
    expect(() => validateConfig({ ...createDefaultConfig('/tmp/a'), timeoutMs: 0 })).toThrow();
  });
});

describe('name validation', () => {
  it('accepts safe names and rejects invalid prefix chars', () => {
    expect(validateAutomationName('Price Checker 1')).toBe('Price Checker 1');
    expect(() => validateAutomationName('_bad')).toThrow();
  });
});

describe('cron alias mapping', () => {
  it('maps aliases and validates raw cron', () => {
    expect(resolveCronExpression('daily')).toBe('0 9 * * *');
    expect(resolveCronExpression('0 0 * * *')).toBe('0 0 * * *');
  });
});

describe('workflow generation snapshot', () => {
  it('writes workflow content', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'clickcron-workflow-'));
    const result = await createScheduleWorkflow(
      { name: 'My Monitor', aliasOrCron: 'weekly', cwd },
      ({ name, cron }) => `name:${name}\ncron:${cron}\n`,
    );
    const content = await readFile(result.workflowPath, 'utf8');
    expect(content).toMatchInlineSnapshot(`"name:my-monitor\ncron:0 9 * * 1\n"`);
  });
});

describe('metadata IO', () => {
  it('writes and reads metadata', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'clickcron-meta-'));
    const config = createDefaultConfig(cwd);
    const created = await writeAutomationMetadata(config, {
      name: 'Price Checker',
      browser: 'chromium',
      timeoutMs: 10000,
      sourceUrl: 'https://example.com',
    });
    const read = await readAutomationMetadata(created.metadataPath);
    expect(read.name).toBe('price-checker');
    expect(read.displayName).toBe('Price Checker');
  });
});

describe('error formatting', () => {
  it('normalizes unknown errors', () => {
    expect(toCliError('oops').message).toBe('Unknown error occurred.');
    expect(toCliError(new Error('boom')).message).toBe('boom');
    expect(toCliError(new CliError('x', 'Y')).code).toBe('Y');
  });
});
