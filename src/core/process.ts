import { spawn } from 'node:child_process';

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export async function execa(
  command: string,
  args: string[],
  options?: { stdio?: 'inherit'; reject?: boolean }
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options?.stdio === 'inherit' ? 'inherit' : 'pipe'
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) child.stdout.on('data', (chunk) => (stdout += String(chunk)));
    if (child.stderr) child.stderr.on('data', (chunk) => (stderr += String(chunk)));

    child.on('error', reject);
    child.on('close', (exitCode) => {
      if (options?.reject !== false && exitCode !== 0) {
        reject(new Error(stderr || `Command failed with exit code ${exitCode}`));
        return;
      }
      resolve({ stdout, stderr, exitCode });
    });
  });
}
