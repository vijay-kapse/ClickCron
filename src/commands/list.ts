import type { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { discoverAutomations } from '../core/automation.js';
import { logError } from '../core/logger.js';

export interface ListOptions {
  json?: boolean;
}

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all saved ClickCron recipes and schedule aliases.')
    .option('--json', 'Render recipe output in JSON format for scripts.')
    .action(async (options: ListOptions) => {
      try {
        const config = await loadConfig();
        const automations = await discoverAutomations(config);

        if (options.json) {
          console.log(JSON.stringify(automations, null, 2));
          return;
        }

        if (automations.length === 0) {
          console.log('No automations found.');
          return;
        }

        console.table(
          automations.map((a) => ({
            name: a.name,
            browser: a.browser,
            updatedAt: a.updatedAt,
            sourceUrl: a.sourceUrl ?? '-'
          }))
        );
      } catch (error) {
        logError(error);
        process.exitCode = 1;
      }
    });
}
