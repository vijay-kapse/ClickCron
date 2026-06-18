import pc from 'picocolors';
import { CliError } from './errors.js';

export function logInfo(message: string): void {
  console.log(`${pc.blue('ℹ')}  ${message}`);
}

export function logSuccess(message: string): void {
  console.log(`${pc.green('✓')}  ${pc.green(message)}`);
}

export function logWarning(message: string): void {
  console.warn(`${pc.yellow('⚠')}  ${pc.yellow(message)}`);
}

export function logHeal(message: string): void {
  console.log(`${pc.magenta('🔧')} ${pc.magenta(message)}`);
}

export function logStep(message: string): void {
  console.log(`${pc.dim('•')}  ${pc.dim(message)}`);
}

export function logError(error: unknown): void {
  const normalized = error instanceof CliError ? error : new CliError(String(error));
  console.error(`${pc.red('✗')}  ${pc.red(normalized.message)}`);
}
