import type { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { logError, logInfo, logSuccess } from '../core/logger.js';
import { runAutomation } from '../core/runner.js';

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
    .action(async (name: string, options: RunOptions) => {
      try {
        if (options.dryRun) {
          logInfo(`Dry run: would execute automation "${name}" [env=${options.env ?? 'default'}].`);
          return;
        }
        const config = await loadConfig();
        const result = await runAutomation(config, name);
        const status = result.success ? 'succeeded' : 'failed';
        logInfo(`Run ${status} for "${name}" in ${result.durationMs}ms.`);
        logInfo(`Artifacts: ${result.resultPath}, ${result.logPath}, ${result.screenshotPath}`);
        if (result.success) logSuccess('Run completed successfully.');
        else process.exitCode = 1;
      } catch (error) {
        logError(error);
        process.exitCode = 1;
      }
    });
}
