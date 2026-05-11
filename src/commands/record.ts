import type { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { logError, logInfo, logSuccess } from '../core/logger.js';
import { recordAutomation } from '../core/recorder.js';

export interface RecordOptions {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headed?: boolean;
  timeout?: string;
}

export function registerRecordCommand(program: Command): void {
  program
    .command('record <name> [url]')
    .description('Record a browser flow and save it as a named ClickCron recipe.')
    .option('-b, --browser <engine>', 'Browser engine to use: chromium, firefox, or webkit.', 'chromium')
    .option('--headed', 'Run browser in headed mode while recording.')
    .option('--timeout <ms>', 'Maximum recording timeout in milliseconds.', '60000')
    .action(async (name: string, url: string | undefined, options: RecordOptions) => {
      try {
        const config = await loadConfig();
        await recordAutomation(config, {
          name,
          url,
          browser: options.browser ?? 'chromium',
          timeoutMs: Number(options.timeout ?? 60000),
        });
        logSuccess(`Recorded automation "${name}".`);
      } catch (error) {
        logInfo(`Recording failed for "${name}".`);
        logError(error);
        process.exitCode = 1;
      }
    });
}
