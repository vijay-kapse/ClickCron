import type { Command } from 'commander';

export interface ExportOptions {
  format?: 'json' | 'yaml';
  output?: string;
}

export function registerExportCommand(program: Command): void {
  program
    .command('export <name>')
    .description('Export a recipe definition for versioning or sharing.')
    .option('--format <type>', 'Output format: json or yaml.', 'json')
    .option('-o, --output <file>', 'Write export payload to a specific file path.')
    .action((name: string, options: ExportOptions) => {
      console.log(`export: ${name} [format=${options.format ?? 'json'}${options.output ? `, output=${options.output}` : ''}]`);
    });
}
