import type { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { logError, logHeal, logInfo, logStep, logSuccess, logWarning } from '../core/logger.js';
import { planRun, runAutomation } from '../core/runner.js';

export interface RunOptions {
  dryRun?: boolean;
  heal?: boolean;
  env?: string;
}

export function registerRunCommand(program: Command): void {
  program
    .command('run <name>')
    .description('Execute a saved recipe immediately by name.')
    .option('--dry-run', 'Resolve and print the execution plan without launching the recipe.')
    .option('--no-heal', 'Disable AI self-healing for this run.')
    .option('--env <name>', 'Environment profile to load before execution.', 'default')
    .action(async (name: string, options: RunOptions) => {
      try {
        const config = await loadConfig();

        if (options.dryRun) {
          const plan = await planRun(config, name);
          logInfo(`Dry run for "${plan.name}" [env=${options.env ?? 'default'}]`);
          logStep(`Browser: ${plan.browser}`);
          logStep(`Spec: ${plan.scriptPath}`);
          logStep(`Command: ${plan.command.join(' ')}`);
          logStep(
            `Self-healing: ${plan.healEnabled ? `on (${plan.healModel})` : 'off'} · ` +
              `API key ${plan.apiKeyPresent ? 'detected' : 'missing'}`
          );
          logStep(
            plan.selectorKeys.length > 0
              ? `Healable selectors: ${plan.selectorKeys.join(', ')}`
              : 'Healable selectors: none captured'
          );
          return;
        }

        const result = await runAutomation(config, name, { heal: options.heal !== false });
        const status = result.success ? 'succeeded' : 'failed';
        logInfo(`Run ${status} for "${name}" in ${result.durationMs}ms.`);
        for (const heal of result.heals) {
          logHeal(
            `Healed "${heal.key}" → ${heal.after.kind} ${JSON.stringify(heal.after.value)} ` +
              `(via ${heal.model})`
          );
        }
        logInfo(`Artifacts: ${result.resultPath}, ${result.logPath}, ${result.screenshotPath}`);
        if (result.success) {
          logSuccess(
            result.heals.length > 0
              ? `Run completed — ${result.heals.length} selector(s) self-healed.`
              : 'Run completed successfully.'
          );
        } else {
          logWarning('Run failed. See the execution log for details.');
          process.exitCode = 1;
        }
      } catch (error) {
        logError(error);
        process.exitCode = 1;
      }
    });
}
