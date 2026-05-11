export interface RunResult {
  name: string;
  success: boolean;
  exitCode: number | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  command: string[];
  runDir: string;
  logPath: string;
  resultPath: string;
  screenshotPath: string;
}
