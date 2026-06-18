import type { SelectorCandidate } from './heal.js';

export interface AutomationMetadata {
  name: string;
  displayName: string;
  scriptPath: string;
  metadataPath: string;
  createdAt: string;
  updatedAt: string;
  sourceUrl?: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  timeoutMs: number;
  /** Selector candidates captured at record time, keyed by candidate key. */
  selectors?: Record<string, SelectorCandidate>;
}

export interface CreateAutomationInput {
  name: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  timeoutMs: number;
  sourceUrl?: string;
  selectors?: Record<string, SelectorCandidate>;
}
