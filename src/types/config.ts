export interface ClickCronPaths {
  automations: string;
  runs: string;
  screenshots: string;
  storage: string;
}

export interface HealConfig {
  /** Master switch for AI self-healing. */
  enabled: boolean;
  /** Anthropic model id used to repair broken selectors. */
  model: string;
  /** Safety cap on heals attempted in a single run. */
  maxHealsPerRun: number;
}

export interface ClickCronConfig {
  version: number;
  defaultBrowser: string;
  headless: boolean;
  timeoutMs: number;
  paths: ClickCronPaths;
  heal: HealConfig;
}
