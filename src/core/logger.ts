import { CliError } from './errors.js';

export function logInfo(message: string): void {
  console.log(`ℹ️  ${message}`);
}

export function logSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

export function logWarning(message: string): void {
  console.warn(`⚠️  ${message}`);
}

export function logError(error: unknown): void {
  const normalized = error instanceof CliError ? error : new CliError(String(error));
  console.error(`❌ ${normalized.message}`);
}
