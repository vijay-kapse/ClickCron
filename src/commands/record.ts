import type { Command } from 'commander';

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
    .action((name: string, url: string | undefined, options: RecordOptions) => {
      console.log(`record: ${name} ${url ?? '(no URL provided)'} [browser=${options.browser ?? 'chromium'}]`);
    });
}
