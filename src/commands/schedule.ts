import type { Command } from 'commander';

export interface ScheduleOptions {
  timezone?: string;
  replace?: boolean;
}

export function registerScheduleCommand(program: Command): void {
  program
    .command('schedule <name> <alias-or-cron>')
    .description('Attach a schedule alias or raw cron expression to a recipe.')
    .option('--timezone <tz>', 'IANA timezone used for schedule evaluation.', 'UTC')
    .option('--replace', 'Replace an existing schedule on this recipe.')
    .action((name: string, aliasOrCron: string, options: ScheduleOptions) => {
      console.log(`schedule: ${name} -> ${aliasOrCron} [tz=${options.timezone ?? 'UTC'}]${options.replace ? ' (replace)' : ''}`);
    });
}
