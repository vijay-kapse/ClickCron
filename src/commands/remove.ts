import type { Command } from 'commander';

export interface RemoveOptions {
  yes?: boolean;
}

export function registerRemoveCommand(program: Command): void {
  program
    .command('remove <name>')
    .description('Remove a saved recipe and its associated local metadata.')
    .option('-y, --yes', 'Skip confirmation prompts and remove immediately.')
    .action((name: string, options: RemoveOptions) => {
      console.log(`remove: ${name}${options.yes ? ' (confirmed)' : ''}`);
    });
}
