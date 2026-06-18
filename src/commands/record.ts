import type { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { logError, logInfo, logSuccess } from '../core/logger.js';
import { recordAutomation, type RecordAutomationOptions } from '../core/recorder.js';

export interface RecordOptions {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headed?: boolean;
  timeout?: string;
}

export function registerRecordCommand(program: Command): void {
  program
    .command('record <name> [url]')
    .description('Record a browser flow and save it as a named ClickCron recipe.')
    .option(
      '-b, --browser <engine>',
      'Browser engine to use: chromium, firefox, or webkit.',
      'chromium'
    )
    .option('--headed', 'Run browser in headed mode while recording.')
    .option('--timeout <ms>', 'Maximum recording timeout in milliseconds.', '60000')
    .action(async (name: string, url: string | undefined, options: RecordOptions) => {
      try {
        const config = await loadConfig();
        const recordOptions: RecordAutomationOptions = {
          name,
          browser: options.browser ?? 'chromium',
          timeoutMs: Number(options.timeout ?? 60000)
        };
        if (url !== undefined) recordOptions.url = url;

        const result = await recordAutomation(config, recordOptions);
        logSuccess(`Recorded automation "${name}".`);
        if (result.healableSelectors > 0) {
          logInfo(
            `Captured ${result.healableSelectors} self-healing selector(s). ` +
              'They will auto-repair if the page changes.'
          );
        } else {
          logInfo(
            'No selectors were auto-converted. The spec runs as-is; wrap locators with ' +
              '`cc(page, …)` from `clickcron/runtime` to enable self-healing.'
          );
        }
      } catch (error) {
        logInfo(`Recording failed for "${name}".`);
        logError(error);
        process.exitCode = 1;
      }
    });
}
