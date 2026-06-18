import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execa } from './process.js';
import type { ClickCronConfig } from '../types/config.js';
import type { RunResult } from '../types/run-result.js';
import type { HealEvent } from '../types/heal.js';
import { applyHealsToMetadata, getAutomationByName } from './automation.js';

export interface RunOptions {
  /** Disable AI self-healing for this run (overrides config). */
  heal?: boolean;
}

export interface RunPlan {
  name: string;
  scriptPath: string;
  browser: string;
  command: string[];
  healEnabled: boolean;
  healModel: string;
  apiKeyPresent: boolean;
  selectorKeys: string[];
}

function buildCommand(scriptPath: string, runDir: string): string[] {
  return ['playwright', 'test', scriptPath, '--screenshot', 'on', '--output', runDir];
}

/** Resolve what a run would do without executing it (used by `--dry-run`). */
export async function planRun(config: ClickCronConfig, name: string): Promise<RunPlan> {
  const automation = await getAutomationByName(config, name);
  const healEnabled = config.heal.enabled;
  return {
    name: automation.name,
    scriptPath: automation.scriptPath,
    browser: automation.browser,
    command: ['npx', ...buildCommand(automation.scriptPath, '<run-dir>')],
    healEnabled,
    healModel: config.heal.model,
    apiKeyPresent:
      Boolean(process.env.ANTHROPIC_API_KEY) || Boolean(process.env.CLICKCRON_HEAL_FAKE),
    selectorKeys: Object.keys(automation.selectors ?? {})
  };
}

async function readHealLog(logPath: string): Promise<HealEvent[]> {
  try {
    const raw = await readFile(logPath, 'utf8');
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as HealEvent);
  } catch {
    return [];
  }
}

export async function runAutomation(
  config: ClickCronConfig,
  name: string,
  options: RunOptions = {}
): Promise<RunResult> {
  const automation = await getAutomationByName(config, name);
  const startedAt = new Date();
  const runStamp = startedAt.toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(config.paths.runs, automation.name, runStamp);
  const screenshotDir = path.join(config.paths.screenshots, automation.name);
  const screenshotPath = path.join(screenshotDir, `${runStamp}.png`);
  const healLogPath = path.join(runDir, 'heals.jsonl');

  await mkdir(runDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });

  const healEnabled = options.heal === false ? false : config.heal.enabled;
  const command = buildCommand(automation.scriptPath, runDir);
  const env: NodeJS.ProcessEnv = {
    CLICKCRON_HEAL_LOG: healLogPath,
    CLICKCRON_HEAL_MODEL: config.heal.model,
    CLICKCRON_HEAL_MAX: String(config.heal.maxHealsPerRun),
    ...(healEnabled ? {} : { CLICKCRON_NO_HEAL: '1' })
  };
  const result = await execa('npx', command, { reject: false, env });

  const heals = await readHealLog(healLogPath);
  const finishedAt = new Date();
  const runResult: RunResult = {
    name: automation.name,
    success: result.exitCode === 0,
    exitCode: result.exitCode,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    command: ['npx', ...command],
    runDir,
    logPath: path.join(runDir, 'execution.log'),
    resultPath: path.join(runDir, 'result.json'),
    screenshotPath,
    heals
  };

  await writeFile(runResult.logPath, `${result.stdout}\n${result.stderr}\n`, 'utf8');
  await writeFile(runResult.resultPath, `${JSON.stringify(runResult, null, 2)}\n`, 'utf8');

  // Persist any healed selectors so the next run starts from the repaired form.
  if (heals.length > 0) {
    await applyHealsToMetadata(config, automation.name, heals);
  }

  return runResult;
}
