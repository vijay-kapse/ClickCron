import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import type { ClickCronConfig } from '../types/config.js';
import {
  resolveConfigFilePath,
  resolveDefaultPaths,
  resolveProjectRoot,
} from './paths.js';

const clickCronConfigSchema = z.object({
  version: z.number().int().positive(),
  defaultBrowser: z.string().min(1),
  headless: z.boolean(),
  timeoutMs: z.number().int().positive(),
  paths: z.object({
    automations: z.string().min(1),
    runs: z.string().min(1),
    screenshots: z.string().min(1),
    storage: z.string().min(1),
  }),
});

export type ClickCronConfigInput = z.input<typeof clickCronConfigSchema>;

export function createDefaultConfig(cwd?: string): ClickCronConfig {
  const projectDir = resolveProjectRoot(cwd);

  return {
    version: 1,
    defaultBrowser: 'chromium',
    headless: true,
    timeoutMs: 30000,
    paths: resolveDefaultPaths(projectDir),
  };
}

export function validateConfig(config: ClickCronConfigInput): ClickCronConfig {
  return clickCronConfigSchema.parse(config);
}

export async function loadConfig(cwd?: string): Promise<ClickCronConfig> {
  const projectDir = resolveProjectRoot(cwd);
  const configPath = resolveConfigFilePath(projectDir);
  const raw = await readFile(configPath, 'utf-8');
  const parsed = JSON.parse(raw) as ClickCronConfigInput;

  return validateConfig(parsed);
}

export async function initializeConfig(cwd?: string): Promise<ClickCronConfig> {
  const projectDir = resolveProjectRoot(cwd);
  const configPath = resolveConfigFilePath(projectDir);
  const config = createDefaultConfig(projectDir);

  await mkdir(config.paths.automations, { recursive: true });
  await mkdir(config.paths.runs, { recursive: true });
  await mkdir(config.paths.screenshots, { recursive: true });
  await mkdir(config.paths.storage, { recursive: true });

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');

  return config;
}
