import type { Command } from 'commander';

export interface InitOptions {
  force?: boolean;
  cwd?: string;
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize ClickCron configuration in the current project.')
    .option('-f, --force', 'Overwrite existing ClickCron files if they already exist.')
    .option('--cwd <path>', 'Working directory where initialization should run.')
    .action((options: InitOptions) => {
      const cwd = options.cwd ?? process.cwd();
      console.log(`init: preparing ClickCron in ${cwd}${options.force ? ' (force)' : ''}`);
    });
}
