import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validateAutomationName, validateCron } from './validation.js';

const CRON_ALIASES: Record<string, string> = {
  hourly: '0 * * * *',
  daily: '0 9 * * *',
  weekly: '0 9 * * 1',
  monthly: '0 9 1 * *',
};

export interface CreateScheduleWorkflowOptions {
  name: string;
  aliasOrCron: string;
  cwd?: string;
  force?: boolean;
}

export interface ScheduleWorkflowResult {
  name: string;
  cron: string;
  workflowPath: string;
  overwritten: boolean;
}

export function resolveCronExpression(aliasOrCron: string): string {
  const normalized = aliasOrCron.trim().toLowerCase();
  const mappedAlias = CRON_ALIASES[normalized];

  if (mappedAlias) {
    return mappedAlias;
  }

  return validateCron(aliasOrCron);
}

export function resolveWorkflowPath(name: string, cwd?: string): string {
  const projectDir = path.resolve(cwd ?? process.cwd());
  return path.join(projectDir, '.github', 'workflows', `clickcron-${name}.yml`);
}

export async function createScheduleWorkflow(
  options: CreateScheduleWorkflowOptions,
  template: (params: { name: string; cron: string }) => string,
): Promise<ScheduleWorkflowResult> {
  const normalizedName = validateAutomationName(options.name).replace(/\s+/g, '-').toLowerCase();
  const cron = resolveCronExpression(options.aliasOrCron);
  const workflowPath = resolveWorkflowPath(normalizedName, options.cwd);

  await mkdir(path.dirname(workflowPath), { recursive: true });

  let overwritten = false;
  try {
    await writeFile(workflowPath, template({ name: normalizedName, cron }), {
      encoding: 'utf-8',
      flag: options.force ? 'w' : 'wx',
    });
    overwritten = Boolean(options.force);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EEXIST' && !options.force) {
      throw new Error(
        `Workflow already exists at ${workflowPath}. Re-run with --force to overwrite.`,
      );
    }
    throw error;
  }

  return { name: normalizedName, cron, workflowPath, overwritten };
}
