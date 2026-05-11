import type { Command } from 'commander';

export interface RunOptions {
  dryRun?: boolean;
  env?: string;
}

export function registerRunCommand(program: Command): void {
  program
    .command('run <name>')
    .description('Execute a saved recipe immediately by name.')
    .option('--dry-run', 'Print the execution plan without launching the recipe.')
    .option('--env <name>', 'Environment profile to load before execution.', 'default')
    .action((name: string, options: RunOptions) => {
      console.log(`run: ${name} [env=${options.env ?? 'default'}]${options.dryRun ? ' (dry-run)' : ''}`);
    });
}
