import type { Command } from 'commander';

export interface DoctorOptions {
  verbose?: boolean;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Run environment diagnostics and surface actionable fixes.')
    .option('-v, --verbose', 'Include detailed diagnostics output.')
    .action((options: DoctorOptions) => {
      console.log(`doctor: running checks${options.verbose ? ' (verbose)' : ''}`);
    });
}
