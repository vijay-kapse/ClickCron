export interface ClickCronPaths {
  automations: string;
  runs: string;
  screenshots: string;
  storage: string;
}

export interface ClickCronConfig {
  version: number;
  defaultBrowser: string;
  headless: boolean;
  timeoutMs: number;
  paths: ClickCronPaths;
}
