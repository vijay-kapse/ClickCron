import type { Command } from 'commander';
import { execa } from '../core/process.js';
import { loadConfig } from '../core/config.js';
import { logInfo, logStep, logSuccess, logWarning } from '../core/logger.js';

export interface DoctorOptions {
  verbose?: boolean;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Run environment diagnostics and surface actionable fixes.')
    .option('-v, --verbose', 'Include detailed diagnostics output.')
    .action(async (options: DoctorOptions) => {
      logInfo(`Running diagnostics${options.verbose ? ' (verbose)' : ''}`);

      const playwrightVersion = await execa('npx', ['playwright', '--version'], {
        reject: false
      });

      if (playwrightVersion.exitCode === 0) {
        logSuccess(`Playwright detected: ${playwrightVersion.stdout.trim()}`);
      } else {
        logWarning(
          'Playwright browsers appear missing. Run `npx playwright install --with-deps` before scheduled runs.'
        );
        if (options.verbose) {
          logStep(
            playwrightVersion.stderr.trim() || 'No additional stderr output from playwright check.'
          );
        }
      }

      // AI self-healing readiness.
      let healEnabled = true;
      let healModel = 'claude-haiku-4-5';
      try {
        const config = await loadConfig();
        healEnabled = config.heal.enabled;
        healModel = config.heal.model;
      } catch {
        logStep('No clickcron.config.json found yet — run `clickcron init` to create one.');
      }

      const apiKeyPresent = Boolean(process.env.ANTHROPIC_API_KEY);
      if (!healEnabled) {
        logWarning('AI self-healing is disabled in clickcron.config.json (heal.enabled = false).');
      } else if (apiKeyPresent) {
        logSuccess(`AI self-healing ready (model: ${healModel}).`);
      } else {
        logWarning(
          'AI self-healing is enabled but ANTHROPIC_API_KEY is not set. ' +
            'Export it to let ClickCron repair broken selectors automatically.'
        );
      }
    });
}
