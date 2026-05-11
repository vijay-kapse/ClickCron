import { access } from 'node:fs/promises';
import type { Command } from 'commander';
import { initializeConfig } from '../core/config.js';
import { resolveConfigFilePath } from '../core/paths.js';

export interface InitOptions {
  force?: boolean;
  cwd?: string;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize ClickCron configuration in the current project.')
    .option('-f, --force', 'Overwrite existing ClickCron files if they already exist.')
    .option('--cwd <path>', 'Working directory where initialization should run.')
    .action(async (options: InitOptions) => {
      const cwd = options.cwd ?? process.cwd();
      const configPath = resolveConfigFilePath(cwd);

      if (!options.force && (await fileExists(configPath))) {
        throw new Error(`Config already exists at ${configPath}. Use --force to overwrite.`);
      }

      const config = await initializeConfig(cwd);
      console.log(`Initialized ClickCron at ${cwd}`);
      console.log(`Created ${configPath}`);
    });
}
