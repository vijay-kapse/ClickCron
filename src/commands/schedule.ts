import type { Command } from 'commander';
import { createScheduleWorkflow, resolveCronExpression } from '../core/scheduler.js';
import { renderGithubActionTemplate } from '../templates/github-action.js';
import { renderLocalCronTemplate } from '../templates/local-cron.js';

export interface ScheduleOptions {
  timezone?: string;
  replace?: boolean;
  force?: boolean;
}

export function registerScheduleCommand(program: Command): void {
  program
    .command('schedule <name> <alias-or-cron>')
    .description('Attach a schedule alias or raw cron expression to a recipe.')
    .option('--timezone <tz>', 'IANA timezone used for schedule evaluation.', 'UTC')
    .option('--replace', 'Deprecated. Use --force to overwrite an existing workflow file.')
    .option('--force', 'Overwrite an existing workflow file if present.')
    .action(async (name: string, aliasOrCron: string, options: ScheduleOptions) => {
      const cron = resolveCronExpression(aliasOrCron);
      const force = Boolean(options.force || options.replace);

      const result = await createScheduleWorkflow(
        { name, aliasOrCron: cron, force },
        renderGithubActionTemplate
      );

      console.log(`✅ Schedule saved for "${result.name}" (${result.cron}).`);
      console.log(
        `📄 Workflow written to ${result.workflowPath}${result.overwritten ? ' (overwritten)' : ''}.`
      );
      console.log('');
      console.log('Local cron (manual setup):');
      console.log(renderLocalCronTemplate({ name: result.name, cron: result.cron }));
      console.log('Next steps:');
      console.log(`1) git add ${result.workflowPath}`);
      console.log(`2) git commit -m "chore: add ClickCron schedule for ${result.name}"`);
      console.log('3) git push');
    });
}
