import type { Command } from 'commander';

export interface ListOptions {
  json?: boolean;
}

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all saved ClickCron recipes and schedule aliases.')
    .option('--json', 'Render recipe output in JSON format for scripts.')
    .action((options: ListOptions) => {
      console.log(`list: showing recipes${options.json ? ' as json' : ''}`);
    });
}
