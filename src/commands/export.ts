import { writeFile } from 'node:fs/promises';
import type { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { buildRecipe, serializeRecipe } from '../core/export.js';
import { logError, logSuccess } from '../core/logger.js';
import { CliError } from '../core/errors.js';

export interface ExportOptions {
  format?: string;
  output?: string;
}

export function registerExportCommand(program: Command): void {
  program
    .command('export <name>')
    .description('Export a recipe (metadata, selectors, and spec) for versioning or sharing.')
    .option('--format <type>', 'Output format: json or yaml.', 'json')
    .option('-o, --output <file>', 'Write export payload to a specific file path.')
    .action(async (name: string, options: ExportOptions) => {
      try {
        const format = options.format ?? 'json';
        if (format !== 'json' && format !== 'yaml') {
          throw new CliError(`Unsupported format "${format}". Use json or yaml.`);
        }
        const config = await loadConfig();
        const recipe = await buildRecipe(config, name);
        const payload = serializeRecipe(recipe, format);

        if (options.output) {
          await writeFile(options.output, payload, 'utf8');
          logSuccess(`Exported "${name}" to ${options.output} (${format}).`);
        } else {
          process.stdout.write(payload);
        }
      } catch (error) {
        logError(error);
        process.exitCode = 1;
      }
    });
}
