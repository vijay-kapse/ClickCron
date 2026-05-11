import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execa } from './process.js';
import type { ClickCronConfig } from '../types/config.js';
import type { RunResult } from '../types/run-result.js';
import { getAutomationByName } from './automation.js';

export async function runAutomation(config: ClickCronConfig, name: string): Promise<RunResult> {
  const automation = await getAutomationByName(config, name);
  const startedAt = new Date();
  const runStamp = startedAt.toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(config.paths.runs, automation.name, runStamp);
  const screenshotDir = path.join(config.paths.screenshots, automation.name);
  const screenshotPath = path.join(screenshotDir, `${runStamp}.png`);

  await mkdir(runDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });

  const command = ['playwright', 'test', automation.scriptPath, '--screenshot', 'on', '--output', runDir];
  const result = await execa('npx', command, { reject: false });

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
  };

  await writeFile(runResult.logPath, `${result.stdout}\n${result.stderr}\n`, 'utf8');
  await writeFile(runResult.resultPath, `${JSON.stringify(runResult, null, 2)}\n`, 'utf8');

  return runResult;
}
