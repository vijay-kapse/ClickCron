import type { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { healAutomation } from '../core/heal-run.js';
import { logError, logHeal, logInfo, logSuccess, logWarning } from '../core/logger.js';

export function registerHealCommand(program: Command): void {
  program
    .command('heal <name>')
    .description(
      "Re-validate a recipe's selectors against the live page and repair broken ones with AI."
    )
    .action(async (name: string) => {
      try {
        const config = await loadConfig();
        if (!config.heal.enabled) {
          logWarning(
            'AI self-healing is disabled in clickcron.config.json (heal.enabled = false).'
          );
          return;
        }
        if (!process.env.ANTHROPIC_API_KEY && !process.env.CLICKCRON_HEAL_FAKE) {
          logWarning('Set ANTHROPIC_API_KEY to enable AI self-healing before running `heal`.');
          return;
        }

        logInfo(`Validating selectors for "${name}"...`);
        const result = await healAutomation(config, name);

        if (result.checked === 0) {
          logInfo(`No healable selectors captured for "${name}".`);
          return;
        }
        for (const heal of result.heals) {
          logHeal(
            `Repaired "${heal.key}" → ${heal.after.kind} ${JSON.stringify(heal.after.value)}`
          );
        }
        if (result.heals.length === 0) {
          logSuccess(`All ${result.checked} selector(s) still resolve — nothing to heal.`);
        } else {
          logSuccess(
            `Healed ${result.heals.length} of ${result.checked} selector(s); metadata updated.`
          );
        }
      } catch (error) {
        logError(error);
        process.exitCode = 1;
      }
    });
}
