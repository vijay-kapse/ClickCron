import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { removeAutomation } from '../core/automation.js';
import { logError, logSuccess } from '../core/logger.js';

export interface RemoveOptions {
  yes?: boolean;
  deleteRuns?: boolean;
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input, output });
  const answer = await rl.question(`${prompt} [y/N] `);
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

export function registerRemoveCommand(program: Command): void {
  program
    .command('remove <name>')
    .description('Remove a saved recipe and its associated local metadata.')
    .option('-y, --yes', 'Skip confirmation prompts and remove immediately.')
    .option('--delete-runs', 'Also remove run history for this automation.')
    .action(async (name: string, options: RemoveOptions) => {
      try {
        if (!options.yes) {
          const ok = await confirm(`Remove automation "${name}"?`);
          if (!ok) return;
        }
        const config = await loadConfig();
        await removeAutomation(config, name, Boolean(options.deleteRuns));
        logSuccess(`Removed automation "${name}"${options.deleteRuns ? ' and run history' : ''}.`);
      } catch (error) {
        logError(error);
        process.exitCode = 1;
      }
    });
}
