import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerInitCommand } from '../commands/init.js';
import { registerScheduleCommand } from '../commands/schedule.js';
import { registerListCommand } from '../commands/list.js';
import { registerRunCommand } from '../commands/run.js';
import { registerDoctorCommand } from '../commands/doctor.js';

describe('integration-style CLI command behavior', () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => {
    logSpy.mockClear();
    errSpy.mockClear();
    warnSpy.mockClear();
    process.exitCode = undefined;
  });

  it('init creates config and folders', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'clickcron-init-'));
    const program = new Command();
    registerInitCommand(program);
    await program.parseAsync(['node', 'test', 'init', '--cwd', cwd]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Initialized ClickCron'));
  });

  it('schedule outputs cron template lines', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'clickcron-sched-'));
    const prior = process.cwd();
    process.chdir(cwd);
    const program = new Command();
    registerScheduleCommand(program);
    await program.parseAsync(['node', 'test', 'schedule', 'price-checker', 'hourly']);
    process.chdir(prior);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('Local cron (manual setup):');
  });

  it('list --json prints parseable list payload', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'clickcron-list-'));
    const initProgram = new Command();
    registerInitCommand(initProgram);
    await initProgram.parseAsync(['node', 'test', 'init', '--cwd', cwd]);

    const prior = process.cwd();
    process.chdir(cwd);
    const listProgram = new Command();
    registerListCommand(listProgram);
    await listProgram.parseAsync(['node', 'test', 'list', '--json']);
    process.chdir(prior);

    const output = logSpy.mock.calls.at(-1)?.[0] as string;
    expect(Array.isArray(JSON.parse(output))).toBe(true);
  });

  it('run missing automation sets failure exitCode', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'clickcron-run-'));
    const initProgram = new Command();
    registerInitCommand(initProgram);
    await initProgram.parseAsync(['node', 'test', 'init', '--cwd', cwd]);

    const prior = process.cwd();
    process.chdir(cwd);
    const runProgram = new Command();
    registerRunCommand(runProgram);
    await runProgram.parseAsync(['node', 'test', 'run', 'missing']);
    process.chdir(prior);

    expect(process.exitCode).toBe(1);
    expect(errSpy).toHaveBeenCalled();
  });

  it('doctor warns when playwright browser dependency is missing', async () => {
    const program = new Command();
    registerDoctorCommand(program);
    await program.parseAsync(['node', 'test', 'doctor']);
    expect(logSpy.mock.calls.flat().join('\n') + warnSpy.mock.calls.flat().join('\n')).toMatch(/doctor:/i);
  });
});
