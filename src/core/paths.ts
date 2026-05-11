import path from 'node:path';
import type { ClickCronPaths } from '../types/config.js';

export const CONFIG_FILE_NAME = 'clickcron.config.json';
export const INTERNAL_DIR_NAME = '.clickcron';

export function resolveProjectRoot(cwd?: string): string {
  return path.resolve(cwd ?? process.cwd());
}

export function resolveConfigFilePath(projectDir: string): string {
  return path.join(projectDir, CONFIG_FILE_NAME);
}

export function resolveDefaultPaths(projectDir: string): ClickCronPaths {
  return {
    automations: path.join(projectDir, 'automations'),
    runs: path.join(projectDir, INTERNAL_DIR_NAME, 'runs'),
    screenshots: path.join(projectDir, INTERNAL_DIR_NAME, 'screenshots'),
    storage: path.join(projectDir, INTERNAL_DIR_NAME, 'storage'),
  };
}
