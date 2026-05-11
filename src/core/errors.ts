export class CliError extends Error {
  public readonly code: string;

  public constructor(message: string, code = 'CLICKCRON_ERROR') {
    super(message);
    this.name = 'CliError';
    this.code = code;
  }
}

export function toCliError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError(error.message);
  }

  return new CliError('Unknown error occurred.');
}
