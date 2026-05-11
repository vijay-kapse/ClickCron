import type { Command } from 'commander';
import { execa } from '../core/process.js';
import { logInfo, logSuccess, logWarning } from '../core/logger.js';

export interface DoctorOptions {
  verbose?: boolean;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Run environment diagnostics and surface actionable fixes.')
    .option('-v, --verbose', 'Include detailed diagnostics output.')
    .action(async (options: DoctorOptions) => {
      logInfo(`doctor: running checks${options.verbose ? ' (verbose)' : ''}`);

      const playwrightVersion = await execa('npx', ['playwright', '--version'], {
        reject: false,
      });

      if (playwrightVersion.exitCode === 0) {
        logSuccess(`Playwright detected: ${playwrightVersion.stdout.trim()}`);
      } else {
        logWarning(
          'Playwright browsers appear missing. Run `npx playwright install --with-deps` before scheduled runs.',
        );
        if (options.verbose) {
          logInfo(playwrightVersion.stderr.trim() || 'No additional stderr output from playwright check.');
        }
      }
    });
}
